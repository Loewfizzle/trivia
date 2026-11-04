# CITY 2.0 — REVIEW #6 (FR6, read-only, Nov 4 2026: THE CONSOLE — everything since FR5, the desktop items, green-means-green)

Fresh eyes on the console at commit `c9b4fde` (Step 0's two docs committed on their own: plan.md "OWNER'S NOTES — NOV 4 (late morning)" +
decisions.md). Nothing but this file and Step 0 was written — no code, no tests, no config; NOTHING touched the live site (the emulators,
`serve.mjs --emu`, the previews, Chromium 1248 + Playwright's WebKit 2215, all on the mini PC). Method: seven read-only investigations in
parallel (A+F speed / memory / desktop with the browser; B the console's flows on two + three slots; C security + data; E the free plans;
G the tests + the pass overhead; H code health; D the cartridge contract read by hand against `Downloads\NEON\overclock\OVERCLOCK-PLAN.md`
+ HOUSE-RULES) — every headline claim re-read in the code by the writer (the two data-loss findings, the gitignore gap, the service worker's
revalidation, the three-song decode, the boot graph). Sizes: **S** < 30 min · **M** 1–2 h · **L** half a day or more. The owner's rule
applied throughout: NO TRAFFIC YET — real problems only (code, look, speed, memory, security, the free plans, data a player could lose).

## In plain words (for the phone)

**What's solid.** The console holds. The room in the city costs the phone nothing measurable (≤ 1 ms over a plain night, the GUESTS sheet
≤ 0.6 ms more, the strips' GPU surface idle for commons and OFF when the sheet closes); the city pause really frees everything (70 MB of
canvases → 0.2 MB, no city timer, no GL, no frame loop) and **eight room → match → room cycles leak nothing**; the profile + CUSTOMIZE move
on the compositor only (0 frames of JS); a full legendary card is one GPU slot at ~2 ms. FR5's floor stands (10.8 vs 11.2 ms). Nobody can
grant themselves a card, a level, a member number, a crew role or a sighting — every grant is a server transaction, every result is
replayed on the server, exactly once. The client writes nothing it shouldn't; the rules match it row for row. The teardown is 1:1. The new
code is small and lives in many small files; the standing rules (the timetable, the tier table, the canvases, the force flags, names only
to owners) hold by test in everything built since FR5.

**What's risky.** Three things, none of them the city. (1) **The cloud has not run on LOBBY 2.0 B at all** — not a red run, NO run: the
final push was one docs commit, and GitHub's path filter drops a push with no code file BEFORE it reads the tag; the quick `tests` workflow
has the same hole. The `room2` job has never run in the cloud. One line fixes it. (2) **Silent refusals are a class, not a bug** — 23 client
writes swallow a PERMISSION_DENIED (player answers in PRISM DROP among them, the host's beat, the rematch ring's clear); 2B's show was one
of them. The fix is one place (every write goes through `firebase.js:20`) plus a fixture of the rules AS PUBLISHED that the unit suite
checks before every push — a rules change then fails the suite until the summary line is written. (3) **The repros ran on the live site**:
27 scripts take a base URL, one defaults to neonspeakeasy.com, nothing guards it, and a seeded test phone gets a real profile + member
number at boot; the room push has no silent flag and no rate limit (anyone with a script could ping your watch 1,400 times). Beside these:
the free plans are fine for a game night but the tightest number is one nobody watched — **Vercel edge requests** (457 per visit: 366 ES
modules, re-requested on every load by the service worker); and **`shots/` (1.8 GB) is not in `.gitignore`** — one `git add .` away from a
repo GitHub refuses.

**What could break for a real player.** Two S fixes: **a "blank" profile that owns a sighting card is deleted on restore** (the Home Screen
app opens as a stranger → the player taps the UFO → BRING YOUR CARD → the new profile goes WITH the card; the appearance has passed), and
**the restore overwrites the device's previous key without keeping it** (the `ensure` path keeps it; the restore path doesn't). One board can be
cheated by a hacked host (PRISM DROP's rush bound reads host-written data). And one thing a player will MEET: a guest who has their profile,
CUSTOMIZE, the ☰ menu or HOW TO PLAY open when the host taps INITIATE keeps that sheet over the running match (its clock running) until they
back out of two screens — the start closes only GUESTS, GAMES and the profile's own sheets (seen in WebKit). Everything else a player has is safe.

**What we'd gain.** On the phone: the one thing a player SEES after a match — the dark sky before the walk-out (≈ 5 s at 4×, ≈ 0.6 s on the
iPhone) — down by a quarter from spreading the promenade's first-minute plan over frames (the same fix takes 130 ms off the desktop's resize
stall); a legendary strip 20 % cheaper from caching the laser's colour parsing; a fresh visit 17.6 → ~11 MB and a phone-hour 55 → ~40 MB of
music by not fetching the song that just ended and keeping decoded buffers across the pause. In a pass: **the full local run 26 → ~18.5 min**
(the serial tail is the critical path, not the shards), the holiday job's recurring red gone (a test bug: a roam pause reads as "still"), the
sighting capture's 12 ms line gone (never a phone budget), the profile E2E's re-run gone, 7 of 9 cloud warnings gone (the vault's speed checks
on a GPU-less runner → skipped). For OVERCLOCK: four contract questions SHELL 2.0 must settle before pass 1 or the rebuild gets redone —
every game's logic loads at boot (290 KB, all twelve), the DAILY plug-in has no runtime to run in, SOLO never reaches `/api`, per-player
memory has no home.

## THE TOP 10 (the highest gain / the biggest risk removed for the lowest cost, ranked)

| # | finding | gain | risk | size |
| --- | --- | --- | --- | --- |
| 1 | **TWO S HOLES WHERE A PLAYER LOSES SOMETHING.** (a) **A "blank" profile that owns a SIGHTING CARD is DELETED on restore** — `api/_lib/profiles.js:186–195 dropIfBlank` counts finished matches only; items granted without a match (a sighting, THE KNOCK, THE WATCHER, a birthday) don't count: count them, or merge `it` + `pa.sg` into the restored profile, + a server test (C1). (b) **The restore drops the device's previous key** — `js/profile/me.js:99` saves the new key without pushing the old into `oldKeys` as `keepNewKey` does (C2) | no legendary card lost through BRING YOUR CARD; no key lost from a phone | low (check `sgk` so an appearance isn't counted twice) | S + S |
| 2 | **ONE WRITE PATH THAT REPORTS A REFUSAL + THE RULES AS PUBLISHED** — `js/firebase.js:20 call()`: catch `PERMISSION_DENIED`, report once per path a session to /admin, rethrow; `tests/fixtures/rules-live.json` (the rules as last published) loaded by `oldrules`; `tests/rules-live.test.mjs` fails on a changed `database.rules.json` until the ack carries the summary's line (G6, C7) | 2B's class of silent failure closed for good; the re-publish reminder mechanical | none | M |
| 3 | **THE CLOUD TRIGGER** — drop `paths:` (harbor.yml:16–46) + `paths-ignore` (tests.yml:13, 15); read the tag from `head_commit.message` (G5). FR6 FIXES' tagged push is the first cloud run of 2B's code | the one cloud confirmation a pass has, every pass | none (an untagged docs push stays skipped) | S |
| 4 | **TESTS + REPROS OFF THE LIVE SITE, AND THE PUSH TAMED** — the harness / kit / wk-room / lab-export / shots refuse a non-localhost base without `I_KNOW_THIS_IS_LIVE=1 && TEST=1`; `&test=1` skips `syncMe` (no profile, no member number) and sends `radioRoomOpened` silent; the push fires 10 s after `enterRoom` (cleared on exit), the server wants a player + the host online, one global bucket ≤ 10/h + one per uid; the url `/?room=CODE` (G7, C4) | no more real pushes / member numbers from a test; no push spam | none | S + S + S |
| 5 | **A SHEET OPEN AT THE GAME START STAYS OVER THE GAME** — `room-city.js:283–287` closes GUESTS, GAMES + the profile's pfs stack only; a guest's profile overlay, CUSTOMIZE, the full card, the ☰ menu or HOW TO PLAY sits over the running match (its clock running) until they back out of two screens. ONE `layers.js#closeAll()` at the stamp (B1; covers B7's kick too); and the REMATCH ring's missing busy guard = an in-flight promise in `host.js#startGame` (B4); a toast when a start dies with the host (B2) | nobody misses a match's first seconds behind their card; no double match from a double-tap on a slow network | low | S + S + S |
| 6 | **THE REBUILD AFTER A MATCH** — the promenade's first minute is planned in one go (`harbor-people.js:236 segRect` 739 ms + `:256 route` 365 at 4× = 1.3 s of the 5-s rebuild); plan the first block, the rest one a frame behind the bake pump; `meta/back` + `status: lobby` in one update (A2). The same re-plan is 130 ms of the desktop's resize stall (A6) | ≈ −0.3 s of dark sky on the phone; −130 ms on a resize | low | M + S |
| 7 | **EDGE REQUESTS** — 457 a fresh visit, ~380 a repeat (`sw.js:22` revalidates every file): a `vercel.json` header for `/js/*` + `/css/*` (`max-age=300, stale-while-revalidate`), the SW on the default cache mode, busted by the build id `/api/log` already returns (E1) | a repeat visit 380 → ~20 requests; the tightest Vercel number ×10 headroom | ≤ 5 min of stale JS after a deploy | M |
| 8 | **THE MUSIC** — skip the PREVIOUS song unless this phone decoded it (`synced-songs.js:59–66`); keep decoded buffers across the city rebuild (`party-music.js:132–137`) (E2 a + b); the music is 90 % of every byte | a fresh visit 17.6 → ~11 MB; a phone-hour 55 → ~40 MB | none | S + S/M |
| 9 | **GREEN MEANS GREEN + THE TAIL** — the spider's HUB still (`holiday.mjs:74–80`: `far < 1 && scared < 0.05 && !trip`), the capture's `ms < 12` clause dropped (`holiday.mjs:461`), the board-row seed in `e2e-profiles.mjs`, the vault's five `okT` → `skipCI`, the tape watchdog's "either recovery"; `oldrules` beside `panel`, SHARDS=6 after one measured run (G1, G3, G4, G8) | the holiday job's red gone, one re-run fewer, 7 of 9 warnings gone; **the full local run 26 → ~18.5 min** | none | S ×6 |
| 10 | **THE FOUR CONTRACT QUESTIONS SHELL 2.0 MUST SETTLE** — the games' logic loads at boot (290 KB for twelve: a thin `meta` + a lazy `logic`, D1); THE DAILY runs nowhere (make it a SOLO ROOM with a date seed, D2); SOLO never reaches `/api` (`match-report.js:232`, D3); per-player content memory has no home (D7) — plus the podium's owner (D8) | OVERCLOCK's first pass built on the right plug, not redone | design (a questions round) | M + 3 decisions |

Beside the ten (S each, in FR6 FIXES anyway): `/shots/` into `.gitignore` (E4 — a 2-GB accident waiting); PRISM DROP's rush bound capped
from the settings, not the host's `sd` (C3); the admin's pid out of `live=1` (C5); the save-your-key pop-up's two phantom classes + the five
pop-up roots onto ONE SHEET STACK (H1, H2); the dock's glass without `backdrop-filter` during the push (H5); `/api/time` 15 → ~5 samples
(E3); the cut-off speakeasy + the lines on desktop (F1, F2) and the right bench's depth (F4); the laser's colour cache (A3); the registration
checker for a playable game (D5); the logs pruned on write (C8). The owner's two decisions: a MUSIC BUCKET (E5 — the repo, the deploy and the
bandwidth answered at once, ~40 days before the 1 GB line) and whether a solo match counts for the streak (D3).

---

## A. SPEED + MEMORY ON THE PHONE

**How it was measured** (FR5's method, so the numbers compare): Chromium 1248 with the GPU on (`--enable-gpu --use-angle=d3d11`, the real
compositor), 402×874 @3, CPU 2× for the frame side (FR5's floor: a plain night 11.2 / 15.0 ms work mean / p95), CPU 4× for the rebuilds
(÷ ~4 for the iPhone); title-perf's rAF wrapper ("work" = ms of rAF callbacks a frame), the scene's own `cost()`, CDP Profiler self time at
0.5 ms, heap snapshots without V8's code (`kit.mjs#heapNoCode`), `canvas-safe.js#canvasMb`, plus counters installed before any page script
(live intervals, rAF loops a frame, contexts created, long tasks). Rooms: the host's page + fake guests PATCHed into the emulator
(`lobby2.mjs#fakeGuests`). The raw logs, profiles + screenshots: the scratchpad's `A/out/`. WebKit was NOT run this time (the budget went to
the cycle loop, the rebuild profile and the desktop) — every ratio is Chromium's; a 10-minute follow-up with `wk-room.mjs`'s launch gives the
room's frame side on Safari's engine.

### A1. THE HEADROOM LEFT (this machine at 2×, GPU on; FR5's floor 11.2 / 15.0)

| state | work mean / p95 (the scene's own) | verdict |
| --- | --- | --- |
| a plain night, no room | 10.8 / 13.4 (10.6) | **the floor holds — nothing since FR5 slowed it** |
| the room of 8, standing (a DAY city — A7) | 9.5 / 11.4 (9.2) | the room's own cost inside the noise (≤ 1 ms); a second rAF loop (the tags) = 2.0 rAF a frame |
| the room of 8 + GUESTS open (8 common strips) | 10.1 / 11.6 (9.8) | + ≤ 0.6 ms; the strips' surface 1.94 MP GL, 0 slots for commons, 0.3 ms; the fx loop STOPS when the sheet closes (0 frames in 1.2 s) |
| the room of 8 + GUESTS, Sat 22:15 + a Blackbird from the link | 10.5–10.8 / 14.0–14.2 | **NOT the party — a room drops the link's clock + flags (A7); unmeasured** |
| 8 LEGENDARY strips alone (the lab's lobby, emblems + glows) | 6.2 / 7.5 (fx 5.5; 32 GL draws, 1.77 MP) | a Friday room of eight legendaries ≈ the city + 6 ms at 2× → ~1.5–2 ms of JS on the iPhone + the GPU's fill: 60 fps; THE BORDER LASER is 2/3 of it (A3) |
| the pause's rebuild (4×) | the title +2.3–3.0 s · the city shown +4.8–5.0 · its first frame +5.0–5.2 | **≈ 0.6 s of DARK SKY on the phone — the one thing a player sees (A2)** |
| the profile + CUSTOMIZE (the EMBLEM tab) | **0 rAF frames in 8 s**; ~16 ms/s busy (7 CSS animations on the compositor) | free |
| a full DEV card on top | 2.3–2.6 (one GL slot, 35 draws, 0.78 MP); the lab's full TR-3B 1.5 | free — THE PROMINENCE RULE holds |
| the cycle: a room of 2 at cycle 8 vs 2 | 13.1 / 17.6 (4.3 % slow) vs 11.5 / 13.9 (0.9 %) | WATCH — one window each; the walk-out / banner may have been in it; the live counters say nothing accumulates (A4) |

**Memory, the worst state measured** (402×874 @3): a room of 8 + GUESTS: canvases 72.8 MB (195) / 73.7 (222), the JS heap 38–58 MB (+25–30 MB
of V8 code), DOM 1,540 nodes, 1 AudioContext, 1 WebGL context (the strips' surface — tracked through `glCtx`, so the guard counts it). A full
LEGENDARY card on top adds its own surfaces (the lab's full TR-3B: 17.9 MB, 26 canvases). **Estimate for "the city at 3× + a sheet + a card":
~95 MB canvases + ~70 MB JS heap + ~25 MB DOM / CSS / GL ≈ 190–220 MB committed** — under a third of iOS 18 Safari's per-tab limit on a 2021+
iPhone. The city alone on a plain night: 61 MB (238), heap-no-code 32 MB, 10 intervals.

| # | finding | where | the fix | gain | risk | size |
| --- | --- | --- | --- | --- | --- | --- |
| A2 | **THE CITY's REBUILD AFTER A MATCH is ~5 s at 4× CPU** (every one of 8 cycles): `backToLobby()` → the title +2.3–3.0 s → the city shown +4.8–5.0 → its first frame +5.0–5.2; 16–36 long tasks = 3.7–5.0 s, the biggest 650–800 ms. Inside one rebuild (9.75 s sampled): `(program)` 5,185 ms (native raster / style / the socket), **`core/harbor-people.js:236 segRect` 739 + `:256 route` 365 + `:250 clear` 41 = 1,290 ms — the promenade's whole first minute planned in one go (FR5 A3's open M item, still open)**, `clouds.js:177 heapField` 202 (+ `cirrusGen` 56, `fbm2` 42), `core/harbor-show.js:107 choices` 106 + `:69 partyPlan` 63, `core/harbor-neon.js:640 depthContacts` 130, `blocks.js` 190, GC 162. On the phone (÷4): ≈ 0.6–0.75 s from the podium's tap to the title, then ≈ 0.6 s of dark sky before the walk-out; the biggest single task ≈ 160–200 ms | `js/host.js:198–216 backToLobby` (two sequential awaited round trips) → `app.js:170 render` → the title's mount → `scene.js:538 layout` + the bakes | (1) plan the people's FIRST block only, the rest one block a frame behind the bake pump (the LRU already warms 70 s ahead); (2) write `meta/back` + `meta/status: lobby` in ONE update; (3) paint the baked sky in the first task, the bands follow (the reveal gate already fades) | −1.3 s at 4× (≈ −0.3 s on the phone) from (1); one round trip from (2) | low · low · medium | M · S · M |
| A3 | **THE BORDER LASER is 2/3 of a legendary strip's cost.** The vault bench (4×, software canvas): 4.03 ms busy a frame for the lab's lobby — THE BORDER LASER 2.7 of it (`nolaser` 1.35), the sprites 0.7, emblem + glow ≤ 0.5 (`nofx` 0.6). Profile: `gl.js:237 pv` 909 ms / 8 s, `:196 vtx` 235, `:284 strokePoly` 228, `laser.js:30 drawLaser` 189, **`gl.js:51 parseColour` 172 ms — colour strings parsed every frame per gradient stop; `gl.js:74–77` rebuilds a gradient's stop signature per use**, `bufferData` 150 | `js/fx/gl.js:51, :74, :237, :284`, `js/fx/laser.js:8–30` | cache `parseColour` by string (a Map); cache a gradient's parsed stops once (a dirty flag instead of `_sig` per use); the laser's polyline with fewer segments at tier ≤ 1 | −0.3–0.5 ms a frame in a lobby of legendaries (~20 % of `pv`) | none | S |
| A4 | **THE CYCLE LOOP — NO LEAK** (8 cycles room ↔ OVERCLOCK, 4 min): heap-no-code back in the room 39.8 → 40.1 → 40.3 → 40.6 MB (c1 / c2 / c4 / c8), DOM 982 → 982, live intervals 14 → 14, CDP listeners 182 → 174, 1 AudioContext, canvases 64.1 → 66.0 MB (186 → 197); during a match 0.2–0.3 MB (9–15 small canvases), DOM 179; V8's CODE 25.3 → 30.6 MB (the JIT — ATM-A's known shape). 2B's pause numbers held: 70.2 MB (204) → **0.2 MB (9)** → 64.1 (186); heap 42.9 → 37.5 → 41.9; intervals 14 → 8 (the app's own) → 14; no GL context survives; `window.__district` gone. **Nothing of the city survives the pause; nothing measurable accumulates across cycles.** The one WATCH: the frame work at cycle 8 (+1.6 ms mean) — one window each | `tests/integration/harbor-e2e/lobby2.mjs#citypause` | nothing to fix; proof if wanted: `citypause` × 8 cycles with a frame window every 4 | — | — | S |
| A5 | **WORK WHILE NOTHING NEEDS IT — clean**: `ui/layers.js#watchLayers` = a MutationObserver on `<body>`, `childList` only (one callback per pop-up, nothing for the tags / toasts / the veil); the fx loop stops at 0 live slots (`renderer.js:243`) and when its host leaves (`:214`); the dock flame is painted once (`progress/flame.js`); keypop retries every 2.5 s only while covered; the profile + CUSTOMIZE run 0 rAF frames. The fx renderer's per-frame allocations (`{ ...Q }` per slot, `save()`'s `{ ...S }`): GC 1–2 % in the lab lobby — not worth pooling. No cache keyed per frame in the new code | — | — | — | — | — |
| A6 | **THE RESIZE STALL on desktop (1440×900, CPU 1×)**: three long tasks 159 + 116 + 234 ms right after the 180-ms debounce (+219 ms on a second resize) = **~0.5 s**; self time: `drawImage` 246 + `fillRect` 67 (the bands re-baked), **`harbor-people.js:236 segRect` 91 + `:256 route` 36 — the promenade RE-PLANNED on a resize**, `lights.js:67 drawLit` 57 + `tubes.js:48` 33, `harbor-neon.js:640 depthContacts` 56, `road.js:261 word` 37, `tubes.js:12 rgba` 36, `harbor-neon.js:133 outlines` 23 | `scene.js:2729 onResize` → `:2748 build('a resize')` (one task by design — the held frame covers it), `scene.js:538 layout` | keep the people's VISITS on a resize (re-project — the plan is in world units); bake the bands one a frame behind the held frame | −130 ms sure (the re-plan); −250 ms more with the bakes spread | low · medium | S · M |
| A7 | **A ROOM CANNOT BE MEASURED ON A PARTY NIGHT FROM A LINK** — hosting drops the link's `&when=` / `&force=` (2B: "a room runs the city on the real clock"): `force=party,blackbird&lgnow=1` in a room → `party().on` 0, no legendary, 45 s polled, three tries. So (a) every room number above is a DAY city; (b) **the `roomperf` E2E check (`lobby.mjs:159`, "THE FULL ROOM at 1× ≥ 55 fps") measures whatever hour the suite runs** — green by day, maybe not on a Saturday 22:15; (c) the REAL worst case — 8 in the lines + the party peak + the SR-71 + 8 legendary strips — is unmeasured here AND in the suite | the room's clock on entering; `lobby.mjs:159` | let a PREVIEW link keep its clock + flags in a room (`title.js:660`'s `preview` test exists), or give `roomperf` a `force=party` it keeps; then re-measure A1's missing row (+ WebKit) | the one missing number of the console | low (preview links only) | S + a re-measure |

**Healthy (don't touch):** THE CITY PAUSE frees everything (0.2 MB of canvases, no city timers, no GL, no rAF) and 8 cycles leak nothing — the
destroy-and-rebuild decision is right; the room's own frame cost (the tags' loop, the hit boxes, the dock's 2-s repaint) is inside the
noise; the strips' GL surface idles at 0 slots and stops with the sheet; the profile + CUSTOMIZE move on the compositor only; a full
legendary card = one slot ≈ 1.5–3 ms at 2×; FR5's floor stands.

---

## B. CORRECTNESS + STABILITY OF THE CONSOLE

Walked in **Playwright's WebKit** (Safari's engine), two phones at 402×874 with touch, on the emulators, with the REAL taps (HOST → JOIN by the
link → PLAY → OVERCLOCK → INITIATE → the podium → BACK TO THE ROOM): the sheets at the start, a double-tap on REMATCH, the key pop-up over
CUSTOMIZE, a kick, a 12-s `start()`, the host dying 1 s after the stamp (a hanging `start()` + `goOffline()` — WebKit would not unload a page
with a pending start, so the host's death was simulated in-page; the ROOM-side behaviour is what was measured). The probes + screenshots: the
scratchpad's `B/`. The harbor groups that already cover the room (`room`, `roomchat`, `keypop`, `crewsky`, `oldrules`, `roomfix`, `gamestart`,
`citypause`, `afterparty`, `cartridge`, `leaveroom`, `sheetstack`) were read for what IS covered; the probes went where they don't.

| # | finding | where | severity | the fix | size |
| --- | --- | --- | --- | --- | --- |
| B1 | **A SHEET OPEN WHEN THE GAME STARTS STAYS OVER THE GAME.** Repro: B (a guest) opens YOU → CUSTOMIZE YOUR CARD; A taps PLAY → OVERCLOCK → INITIATE. 1.2 s after the push B's page holds `section.screen.oc` (phase `ready`, its clock RUNNING) UNDER `section.screen.pf-overlay` UNDER `.vl-dress.is-in` — B taps ‹ twice to reach the match. The same for the full card, the ☰ menu, HOW TO PLAY / SETTINGS / CREDITS / the chat (`.modal`s). Why: `startFx()` closes GUESTS + GAMES (`:283`) and the profile's `.pfs` stack (`:287`) only; `profile.js#openCard`'s overlay (a plain `section.screen` on `<body>` closed only by its own ‹), CUSTOMIZE / the full card, `settings-panel.js#closeMenu` and every `.modal` are never swept, and `app.js#render` sweeps nothing on title → game. 2B's "any sheet open closes" holds for the two room sheets | `js/screens/room-city.js:283–287`, `js/screens/profile.js#openCard`, `js/ui/settings-panel.js` | **HIGH** — a player misses the first seconds of a match behind their own card | ONE close-everything at the stamp: `ui/layers.js#closeAll()` over the stack it already keeps (+ `closeCard()`, an exported close for dress / full, `closeMenu()`, every `.modal:not(.out)` via its backdrop click as the Esc handler does), called from `startFx` or `render` on the title → game key change | S |
| B2 | **THE HOST DIES BETWEEN THE STAMP AND THE MATCH**: from the stamp, the guest sees the veil + the sign down at +0.2 s, the veil until ~+9–11 s; **B claimed host 10.3 s after A dropped** (the lobby's presence claim); +11.4 s the room back, PLAY on B, both figures standing, `meta/go` still the dead stamp (no `game`). B's INITIATE → NEED 2+ (correct: A is offline). **Nobody is told the start failed.** Why: `host.js:157` clears `go` only when `start()` REJECTS; `room-city.js:256` holds the veil 9 s then `endFx()`. The stale stamp is harmless afterwards (`goOf` / `startShow` accept it only for a live match or in the lobby's no-game window — verified: no phantom walk-in) | `js/host.js:154–157`, `js/screens/room-city.js:256` | MEDIUM (rare, self-recovering) | when the veil lifts past the cap with the room still `lobby`: a toast "THE START DIDN'T GO THROUGH" on every phone + the (new) host clears `meta/go`; optionally retry `meta.go.g` once | S |
| B3 | **A SLOW `start()` CROSSES THE 9-s CAP**: a 12-s start (two 4.5-s Trivia API timeouts, `feed.js:43, 47`, before the bundled bank ≈ 9 s on a bad network) → +10.0 s the veil OFF, the sign relit, the room back (lobby, no game); +12.4 s a hard cut into the game, no walk-in — on the host's phone too | `js/screens/room-city.js:256`, `js/trivia/feed.js:43–47` | LOW–MEDIUM | hold the veil while `meta.go` is set and the room is `lobby` (with B2's clear so a dead stamp can't hold it forever), or raise the cap past the worst `start()` (≥ 12 s) and show BOOTING… on the veil after 3 s. (D4 is the same story from the clock's side) | S |
| B4 | **THE REMATCH RING HAS NO BUSY GUARD** and `host.js#startGame` no in-flight flag: on the emulator a 120-ms double-tap made ONE match (`body.rc-going`'s `pointer-events: none` ate the second tap after a ~20-ms stamp); on a 200–400-ms round trip the second tap reaches `rematch()` → `startGame()` again — two `meta/go` stamps, two `start()`s, two full `game` writes a second apart (every phone mounts match 1's view then remounts match 2's; match 1's player nodes wiped by match 2's `clearPlayerNodes()`). The podium's REMATCH (`final.js:62`) and INITIATE (`.btn.is-busy`, set synchronously) ARE guarded; the ring (`room-city.js:48`) isn't | `js/screens/room-city.js:48`, `js/host.js#startGame` | MEDIUM on a slow network | a module-level in-flight promise in `host.js#startGame` (return it while pending) — one guard for every caller | S |
| B5 | **THE SAVE-YOUR-KEY POP-UP OPENS OVER CUSTOMIZE AND THE FULL CARD** (`keyPopState() === 'show'`, YOU → CUSTOMIZE, `maybe()` → true: the top layer = `pfs.kp-sheet` over `.vl-dress`; the same over VIEW FULL): its "covered" list names `.sg-shot` / `.vl-full-open`, which don't exist (H1), and not `.vl-dress .vl-full .pf-overlay .gm`. It lands on top (the layer stack) — not stuck, intrusive | `js/profile/keypop.js:41` | LOW | `covered = '.pg-moment, .modal:not(.out), .pfs:not(.is-out), .final, .vl-dress, .vl-full, .pf-overlay, .gm'` — or `layerDebug().open > 0` | S |
| B6 | **OVERCLOCK's `write()` on a null game**: `PAGEERROR null is not an object (evaluating 'game.matchId')` on both phones the moment `backToLobby()` ran with the view's done-timers pending (`view.js:259 const game = g()` → `:263` the `oc/${game.matchId}` path). Normal timing never hits it; the host's END GAME mid-challenge with a tap / timer in flight could (it would land in /admin) | `js/games/overclock/view.js:259–263` | LOW | `if (!game) return;` in `write()` | S |
| B7 | **THE PROFILE OVERLAY SURVIVES A KICK**: the right toast, `state.code` null, the title under it, `.pf-overlay` still up (‹ BACK closes it) | `js/room.js#exitRoom` | LOW | `exitRoom()` → `closeCard()` (B1's `closeAll()` covers it) | S |

**Measured.** THE GAME START with the real taps in WebKit: the sign + the logo on both phones, the push at 2.6 s, the game's clock after the
walk (wk-room.mjs 5/5 + probe-b1). The host's death at the tap → the new host continues: **10.3 s** (the lobby's presence claim); the guest's
veil ~9–11 s. A 12-s start: the veil 10 s, the room 2.4 s, then the game. A 40-s start with the host STILL alive (by accident): the match
landed at +40.2 s and the rules held (the host's write accepted — `hostId` had not moved; B claimed 10 s after the socket finally dropped,
during 'playing', by the beat).

**Healthy (exercised):** HOST → JOIN by the link → the two lines settled; the podium → BACK TO THE ROOM → the walk-out → THE WINNER's BANNER →
the REMATCH ring → a guest's vote lights a dot on the host's phone; INITIATE's double-tap dead (`.is-busy` set synchronously); a KICK's toast +
the title + the session dropped (`resumeSession` → `kicked` → 'gone'); a stale `meta/go` never shows a phantom walk-in; a new host with one live
player refused (NEED 2+). **By reading (not run):** `voteState` derives the voters from the CURRENT players + `rv === back.m` (a leaver's dot
clears; a refreshed voter shows ✓ VOTED again; `rm` stays until a new game or another pick — by design, the room closes idle anyway; a hidden
game's `rm` is false, `host.js:207`); the 404 through `serve.mjs:63` as on Vercel; a stale invite → `roomExists` → "The room behind XXXX has
closed…" (`title.js:1831`); RESTORE in a room → `linkRoomSeat` → `updateMyProfile` rewrites the player node (name / avatar / colour / pid;
`joinedAt` + `ln` kept, presence untouched); the old-rules fallbacks covered by `oldrules`; the walk-out never replays after a refresh past its
end (`backShow` → `done`); the banner flies once per `createRoomBanner` and mid-flight on a refresh (`afterparty`).

**Could not verify:** a true tab close / a locked phone in WebKit with a pending start (the context close hung 40–50 s — the host's death was
simulated in-page); THE CREW's radio edge cases (firing during the start / twice / after leaving; a LOBBY ONLY replay for a late joiner —
`scene-radio.js:36, 61` joins a running moment mid-way and skips one past its `until`, consistent with "plays once"); a late joiner mid-prep /
mid-banner, the host killed mid-podium / mid-vote, QUIT TO THE ROOM then the walk-out on the quitter's city, `rematch()` ×2 at the source —
written, not reached in the budget (by reading, every show derives from the stamps + `night/`; the podium's buttons follow `isHost()`); the
idle close (an hour — `host.js:46` + `room.js#closeIdleRoom` read correct: the host at 60 min, everyone else +90 s).

---

## C. SECURITY + DATA (the repo is public; anti-cheat never depends on secret code)

Every `/api` endpoint + `_lib` added since FR5 read end to end (profile, report, board, admin, log, sky, time, daily; activity, birthday,
catalog, dailies, events, favors, fb, founder, http, lab-text, lab, lb, members, owners, profiles, push, radio, sightings, stats), the rules
file row by row against `rules.test.mjs`, the client's identity path (`js/profile/me.js`, `queue.js`, `keypop.js`). Nothing was run against
the live site or the emulators (the suites were read for coverage).

**The answers first.** (1) **Nobody can grant themselves anything.** Every item, level, streak, achievement, member number, FOUNDER, the
dev cards, a crew role, a sighting, a daily reward and a favor is a server transaction on `pstats/{pid}` (`stats.js:45`, `events.js:25`,
`sightings.js:75`, `daily.js:59`); `pstats pcount progress members radio vault dly` are default-deny (`rules:3–4`; cases `:90, 103, 119`);
`style` answers 403 `locked` for unknown AND unowned ids alike (`profile.js:114` — no oracle); the DEV cards are granted to `ADMIN_PIDS` only
and REVOKED from anyone else on `me` (`:75–83`); the FOUNDER switch + `crewSet` are owner-only (`radio.js:294, :404`), the crew can't grant
and the owner can't be crew (`:413`); a birthday once a year (`birthday.js:27–30`); a favor reserves then refunds (`favors.js:14–21`); a daily
one `start` / `finish` per pid per day (`daily.js:35, 47`). `/api/report` reads only `rooms/{code}/game` + `night/{m}` (`report.js:72`), wants
the night entry stamped at server time (`rules:518–525`) and ≤ 6 h old (`:75`), the reporter seated AND a participant (`:80, 95–96`), the
placings to agree (`:84`), exactly-once through `results/{key}` + `pstats/m/{key}` (`:99–107`, `progress.js:39`), a 45-s gap (`stats.js:16`).
A match that never happened needs a hacked HOST plus two seated anonymous users — the plausibility bounds are the defence there, and one is
open (C3). (2) **Public responses leak nothing but a username** — `lb.js:103–106 publicRow` = `{ id: HMAC(pid), n, a, c, r, l }`; `withShow`
builds display rows from owned ids only (`catalog.js:286–294`); 4xx messages are fixed strings, 5xx "server error" (`http.js:57`); no CORS
headers + no OPTIONS = cross-site POSTs blocked — with ONE exception (C5). (3) **The rules**: every node added since FR5 is owner-only /
host-only / server-only as intended (`ln :127`, `meta/go.at === now`, `back.at === now || unchanged :42–76`, `rv :165–170`, the room's `radio`
read-inherit / no write, `city2/live :1004`, THE SEAL `:1257–1300`, `profiles/{pid}` one at a time `:1131` — an index, no list read); the
default-deny nodes `flags/ rl/ results/ errlog/ phonelog/ gplay/ wx/` have NO test case (one combined case closes it, S). (4) **Secrets**: none
committed (`git ls-files`, `.gitignore:21–27, 60`); `firebase-config.js` public by design. ONE to document: `fb.js:41` — with no `KEY_PEPPER`
set, the pepper falls back to a hash of the service-account key, so rotating the service account WITHOUT setting `KEY_PEPPER` first
invalidates every key hash, board id and daily seed (`docs/profiles.md`: one line).

| # | sev | finding | where | size |
| --- | --- | --- | --- | --- |
| C1 | **1 — a real player loses a card** | **A "blank" profile that owns a SIGHTING CARD (or THE KNOCK / THE WATCHER / a birthday item) is DELETED on restore.** `profiles.js:186–195 dropIfBlank`: `played = stats.g.some(g.p > 0)` counts finished MATCHES only; a profile with no counted match is deleted with its `pstats` + `ppriv` when the device restores another. But items are granted without a match: a CITY SIGHTING (`sightings.js:75` → `it/card-sg-*`), THE KNOCK / THE WATCHER / a birthday (`events.js`). The real path: the Home Screen app opens as a stranger (its own storage) → a new profile → the player taps the UFO (one count per appearance) → BRING YOUR CARD → the new profile goes WITH the card; the appearance has passed. Fix: "played" = a counted match OR any item beyond `SIGN_EMBLEMS` OR `pa.sgt` / `xp` / `dl` > 0 — better, MERGE the blank profile's `it` + `pa.sg` into the restored one (`progress.js#grant` is idempotent; check the restored `ppriv/sgk` first so one appearance isn't counted twice). Test: `server.test.mjs` "restore keeps a blank profile's sighting card" | `api/_lib/profiles.js:186–195` | S |
| C2 | **1 — a key is lost on the device** | **The restore overwrites the device's previous key without keeping it.** `me.js:99 saveKey(formatKey(raw))` then `saveNotes({ …, heldNew: null })` — PERF-A's `keyOffer` / `keepNewKey` (`me.js:36–47`, verified: Grok's me.js:44 IS fixed) protect only the `ensure` path. A device holding played profile A that restores key B loses A's key locally (A survives on the server — key-only recovery, and the key is gone from this phone). Fix: push the previous key into `notes.oldKeys` exactly as `keepNewKey` does (3 lines) | `js/profile/me.js:98–101` | S |
| C3 | 2 — a board can be cheated | **PRISM DROP's Score Rush bound trusts host-written data.** `match-report.js:165–169`: `sec = sum(game.sd) / 1000` — `sd` is written by the HOST (`prism/index.js:32`; `rooms/{code}/game` is host-writable with no validate, `rules:172`); a hacked host with two anonymous slots writes `sd: [1e9]`, `sc: 1e9` and a matching night entry → `/api/report` accepts an arbitrary world record. OVERCLOCK is FINE (`overclock-std` is capped from constants, `:59, 105–114`). Fix: `Math.min(sec, RUSH_MAX_S)` from the setting's range + each `sd[i]` ≤ the longest song + 10 s; a case beside `server.test.mjs:218`. Risk: read `prism/index.js#OPTIONS` for the real max first | `js/core/match-report.js:165–169` | S |
| C4 | 3 — the owner's phone can be spammed | **"A ROOM JUST OPENED" has no global or per-user limit.** `radio.js:533–547 roomOpened`: the caller's own room, created < 2 min ago, once per CODE per hour — nothing per uid / IP / globally, and `createRoom` is unlimited (`rules:12–16`): a create → notify → close loop = one push per hush word (~1,400) to every subscribed phone + watch. The board REPORT push IS limited (8/h/IP, 5/h/device, 400/day — `board.js:32, 52–54, 74`). Fix: one global bucket ≤ 10/hour (reuse `board.js#take`) + one per uid per hour; see G7 for the push's other rules | `api/_lib/radio.js:533–547`, `js/room.js:110` | S |
| C5 | 4 — a privacy leak | **The public `GET /api/admin?live=1` carries the admin's PROFILE ID** (`admin.js:178 by: me` stored, `:272` served to anyone, edge-cached) — and `profiles/{pid}` is readable one at a time by any signed-in user (`rules:1131–1137`): the owner's name, tag, Nº 0001, streak. It contradicts THE RADIO's own "never who fired" (`publicMoment` maps `by` to a role). Fix: `by: v.by ? 'owner' : null` (check `harbor-remote.js` never compares it to a pid) | `api/admin.js:178, 272` | S |
| C6 | 4 — a decision, not a loss | **Any signed-in user can list the live rooms** (`rules:6`: `orderByChild activeAt + limitToFirst ≤ 25 + endAt` — any endAt) and read each (`:11`): names, `players/{uid}/pid`, the game. The chats are members-only (good). If unwanted: `query.endAt <= now − 3600000` in the rule + the sweep client (`room.js:413`) to match — a design call for the owner | `database.rules.json:6` | M |
| C7 | 5 | **Swallowed refusals that matter** (beside G6's class fix): `prism/view.js:447` a refused `st: 'out'` leaves a PLAYABLE game's player alive unseen; `room-city.js:81` the REMATCH ring + the votes never clear; `host.js:157` `go: null` after a failed start → every phone plays a walk-in to nothing. Fix: `errlog.reportError(e, 'rules')` on a permission error (or G6's one place) | three lines | S |
| C8 | 5 | **The logs grow until an admin opens /admin**: `phonelog` (≤ 24 KB × 120/day) is pruned only in `reportList()`, `errlog` (3,000 sigs/day × ~1.3 KB) only in `errorList()`, `rl/` never — weeks, not days, against the 1 GB. Fix: prune in `logReport`; a monthly `rl` sweep | `api/log.js:35`, `api/admin.js:136–153` | S |
| C9 | 5 — document | **A sighting is verified as ON SCREEN, not SEEN**: `verifySighting` checks the server clock (−12 h … +15 s), the phone's zone vs the IP's (≤ 60 min), the seeded timetable (dial, Kp, the balloons replayed at the IP's place, the WATCHER's start) or an owner's radio record reaching this player, within [−3 s, +8 s], one count per appearance (`ppriv/sgk`, a transaction), forced links / previews / the crew refused — a replay is impossible, a forced link refused; what it cannot know is whether the player LOOKED (the timetable is public code, like THE KNOCK's header). Cosmetic; the repo goes private before launch. No fix — one line in docs/progression.md | `js/core/sightings.js:161–179` | — |
| C10 | 5 — by design | **Member numbers burn on every named visitor and every second storage** (assigned on CREATE, `profiles.js:136`; Safari + the Home Screen app = two numbers). The counter is sound (`members.js:49–53`: a `next` transaction then `mn` — a race skips, never shares); `scripts/remove-test-profiles.mjs` is SAFE (it rolls back only when no non-target holds ≥ the lowest target's number, `:35–38` — a real player's number can never be reassigned). Option (M): assign the number on the first counted match | `api/_lib/profiles.js:136` | S doc / M |

**A player losing a profile — the rest checked and FINE:** the link is `uids/{uid} → pid`; NEW KEY retires the hash but every linked device
stays linked (`profiles.js:80–88`) — no split; the apex → www 308 (FR5 E4) = one browser origin; the Home Screen app's second storage is what
BRING YOUR CARD is for (C1 is the hole in it); the results queue: a double report is a no-op, a queued report after a restore maps to the new
pid or returns `outcome: null`; one narrow gap worth a doc line: a uid whose `/api` was down at the join isn't credited by the first report
(`report.js:112–115` — "profiles are polish").

**Healthy (don't touch):** server-side recompute of every grant and result; exactly-once keys everywhere (`results`, `m/{key}`, `dly`,
`sgk`, the favor's refund, the member counter); THE RADIO's per-action roles + the audit, the owner-only crew grant, push keys + subs never
leaving the server, `publicMoment` hiding who fired; THE SEAL for OVERCLOCK; `go / back / rv` on the server clock with the 2B refusal report;
the root default-deny; `ensure` never overwriting a key (PERF-A); the restore's retries; BRING YOUR CARD.

---

## D. THE CARTRIDGE CONTRACT (before OVERCLOCK plugs in)

Read: `js/games/cartridge.js`, `tests/cartridge.test.mjs`, `host.js`, `core/room-show.js`, `lazy-view.js`, `game-options.js`, `app.js`'s
routing, `overclock/index.js`, `core/match-report.js`, `core/achievements.js`, `ui/final.js`; the plan + the house rules in
`Downloads\NEON\overclock\`. Measured: the static import graph from `js/app.js` (a 40-line walker in the scratchpad): **176 files, 2,453 KB
uncompressed — js/core 1,129 KB, js/screens 560, js/audio 215, js/ui 131, js/games 290 KB (ALL TWELVE games' index + director + logic,
the ten hidden included; OVERCLOCK 46.6 KB of which `challenges.js` 33 KB; GRIDLOCK 46; RUM 39), js/trivia 19.** (E measured the same
graph on the wire: 2.66 MB gzipped, 366 requests.)

**The verdict:** the plug is honest and small — REQUIRED / OPTIONAL as data, a pure checker run on the real modules in a page, the console
grepped for game ids (14 files; the only ids left in console code are registries), `start({ now })` with the stamp-first start, `warm()` +
`preload()`, `chatLocked` + `BANNER_NAME` carried by both playable games, the city pause automatic through `app.js:60 / 123`. What it does
NOT yet settle are the four things OVERCLOCK-PLAN.md leans on hardest: loading only when played, SOLO, the DAILY, and per-player memory.
Those are SHELL 2.0's (or the Overclock chat's questions round) — before pass 1, or the rebuild's first pass gets redone.

| # | finding | where | gain | risk | size |
| --- | --- | --- | --- | --- | --- |
| D1 | **THE GAMES' LOGIC LOADS AT BOOT.** `registry.js:12–23` statically imports every game's `index.js`, each pulling its director + logic (+ OVERCLOCK: `challenges.js` 33 KB, `trivia/feed.js` + sources + bank; PRISM: `songs.js`); `match-report.js:12–19` statically imports six games' logic and sits on the profile / results path. The plan's rule "everything Overclock needs loads ONLY when Overclock is played" cannot be met through this plug: the rebuilt OVERCLOCK (20 generators, per-challenge pools, Dumb Luck's odds) would land on every title boot. Fix: split a cartridge into a thin `meta` (DEFAULT_SETTINGS, OPTIONS, estimateMinutes, MUSIC, MIN_PLAYERS / SOLO, BANNER_NAME, CHAT_CHIPS, daily.on) the registry imports, and a lazy `logic` (start, prepare, step, livePaths, finalRanks, sealed, chatLocked, rematchSettings, daily.create) the console awaits at the game start / the host's first tick (`host.js#direct` already returns early while `liveKey` isn't ready; `startGame` already awaits `mod.start`) | `js/games/registry.js:12–23`, `core/match-report.js:12–19` | ~290 KB of JS (≈ 70–80 KB gzipped, ~50–100 ms of parse on an iPhone) off every boot; the rebuild free to grow | low–medium: the host loop tolerates "logic loading" for a tick; `chat/logic.js`'s switch for the hidden games stays static | M — SHELL 2.0 |
| D2 | **THE DAILY PLUG-IN RUNS NOWHERE.** `cartridge.js:37–42` defines `daily = { on, create({ date, uid, now }) → game, resumeKey }`, but a game's `step` runs only in `host.js#direct` INSIDE A ROOM (`state.live` mirrored from `rooms/{CODE}`, THE SEAL in `seal/{CODE}`, `$room` side writes, the player nodes wiped under the room) and a game's VIEW writes its answers to `rooms/{CODE}/<node>`. A daily has no room → THE DAILY MODULE would need a second runtime (a local director + a local `live`) or every game a second view. Recommendation: THE DAILY IS A SOLO ROOM — the console opens a private room of one (its own code namespace outside HUSH WORDS, rules that admit only that uid, no invite), runs the normal host loop, and `daily.create` becomes "the settings + a DATE SEED for `start()`" — which means `start()` must be deterministic from the seed (OVERCLOCK mixes `Math.random()` in, `index.js:22`, and fetches the Trivia API: a daily's bank must be fixed by the day — server-side, or in the seed). Write it into docs/cartridge.md now | `js/games/cartridge.js:37–42`, `host.js:80–95` | no second runtime: the walk-in, the pause, the podium, `/api` all reuse | the room-code + rules design (a SHELL 2.0 / DAILY MODULE question) | M — DESIGN before OVERCLOCK pass 3 |
| D3 | **SOLO IS HALF-WIRED.** `SOLO: true` lowers the minimum (`cartridge.js:68`, `host.js:147`, `game-options.js:53`) and a room of one starts — but `match-report.js:232 unreportable`: "< 2 participants → 'too few players'": a solo match never reaches `/api` (no XP, no streak, no bests, no SOLO card — the plan's "results go through /api like any match", "against your own bests"). Around it: a night entry + THE WINNER's BANNER for one ("BEN TAKES OVERCLOCK!" to himself), a REMATCH VOTE with 0 guests, THE NIGHT's CHAMPION after two solo games, the podium's "WAITING FOR THE HOST", the moment's "1st of 1". Fix: a SOLO lane — `extractMatch` accepts n = 1 when the module says SOLO, no win / placing / night points, records + bests kept (`overclock-solo` boards in `core/boards.js`, bounds in `overclockExtra`); `room-show.js#bannerLines` → [] and `voteState` off for a room of one. The owner decides whether a solo match counts for the streak + the weekly goal | `core/match-report.js:232`, `core/room-show.js:113–151` | solo exists end to end | none | M — DESIGN before OVERCLOCK pass 3 |
| D4 | **`start({ now })` is timed BEFORE the match is built.** `host.js:154–156`: `now = tGo + START_MS + 150` goes into `start()` before the host fetches the bank (OVERCLOCK: `initialBank` → the Trivia API — seconds on a bad line); the first phase is timed from that `now`, so a slow prepare lands a match whose READY (3.2 s) is half spent — the first challenge jumps in (the dark veil holds meanwhile). Fix: `start()` builds the game LAST and the contract passes `at()` — the match's beginning evaluated at build time (the later of the planned moment and the real landing time) — or the console re-stamps after `start()` resolves. And state `preload()`'s budget in the doc ("≤ 2 s on 4G or the view copes") | `js/host.js:154–156`, `cartridge.js:9–10` | no half-spent first phase on a slow start | none | S |
| D5 | **A NEW GAME PLUGS INTO ~15 PLACES; THE CHECKER COVERS 3.** `checkCartridge` checks index.js + the tube mark + the GAMES row. Still hand-registered: `lazy-view.js:9 ORDER` (the stylesheet cascade — a sheet NOT listed is appended last and wins every tie), `audio/music.js:25` (the music map), `css/base.css` (`body[data-theme]`), `ui/help.js RULES`, `ui/game-art.js`, `match-report.js` STANDINGS + EXTRA + bounds, `core/boards.js`, `board/view.js#GAME_LIGHT`, `registry.js ALL_PLAYER_NODES` (a missing root = the node never wiped between matches), `database.rules.json`, `api/_lib/catalog.js` (achievements with `game` + `f` flags), the smoke test's list, `cartridge.test.mjs EXEMPT`. Fix: extend `tests/cartridge.test.mjs` for every PLAYABLE game: ORDER row, music id resolves, theme block, help + art + mark, STANDINGS / EXTRA / boards / GAME_LIGHT keys, every `livePaths` root in ALL_PLAYER_NODES + a rules block for it, the smoke list (H's §3 asks for the same `games-registry` test) | `tests/cartridge.test.mjs` | the rebuild (and every returning game) can't half-register | none | S–M |
| D6 | **The rebuild will be REJECTED by the server's own plausibility** until `match-report.js#overclockExtra` (`:94–113`) + `tests/profiles.test.mjs`'s OVERCLOCK fixture move with the new scoring (QUICK 6 as the default, LEXICON out, DUMB LUCK's payouts up to 2.5 × a challenge, a 30-s max clock): the bound reads today's `MODES` / `CHALLENGE_MS`; a rejected row = no board, silently (`out.rejected`). One line in the Overclock prompt for pass 1 + a unit test that replays a simulated match of the NEW rules through `extractMatch` (0 rejected) | `js/core/match-report.js:94–113` | no silent "no board" after the rebuild | none | S |
| D7 | **PER-PLAYER CONTENT MEMORY HAS NO HOME.** The plan's goal 2 (never a repeat across nights; "profile when available, a local fallback") needs (a) the server keeping each player's seen ids (it can: `/api/report` already replays the room's game copy — append the dealt ids to `pstats/{pid}` there) and (b) the HOST's `start()` learning the participants' sets (a phone reads only its own profile): the clean path is a compact digest each player publishes into their own room node at the join (`players/{uid}/mem/<game>` — own-write rules, size-capped, a bloom filter of a few KB) and `start({ …, memory: { uid: digest } })`. Today `roomSeen()` (`overclock/index.js:9`) remembers only the ROOM's night (`meta/used`). Decide the shape before pass 1 — content + no-repeat is the first pass's foundation | `js/games/overclock/index.js:9`, `api/report.js` | the plan's goal 2 buildable without a second system | the digest's size vs the room node | M — DESIGN (SHELL 2.0 / the questions round) |
| D8 | **THE PODIUM's OWNER.** `ui/final.js#createFinal` draws the console's podium + the host's REMATCH / BACK TO THE ROOM (`:64–70`); the end-of-round moment sits over it. The plan wants OVERCLOCK's own VICTORY screen ("OVERCLOCKED", the tube-sign name, the 2-1-3 podium, award chips, SOLO's "NEW PERSONAL BEST") + a card reveal AFTER it once the server confirms. Define it: a game may export `finalScene(el, game, state)` (its body) while the console keeps the buttons strip + the moment + the reveal order — or fills `createFinal`'s `extra` only. Settle in SHELL 2.0 (the podium is a console screen) so pass 2 doesn't build a podium the console then re-owns | `js/ui/final.js:23–70` | one podium contract | none | S–M — SHELL 2.0 |
| D9 | **The kit pieces OVERCLOCK needs are the console's, not Overclock's**: the custom NUMBER PAD + LETTER KEYBOARD (the WORDLE-type needs the same), the tachometer timer (kit's `createTimer`), the title-card slam / 3-2-1 stamps, THE ANSWER frame. They go in `js/games/kit/` with their own prefix (SHELL 2.0 or OVERCLOCK pass 1), not under `js/games/overclock/` — the house rules' "ONE shared OVERDRIVE kit" is the look; these four are mechanics | `js/games/kit/` | the WORDLE-type + COAST CLEAR reuse them | none | S (a line in the prompt) |
| D10 | **FONTS**: `index.html:77` preloads Google Fonts for everyone; OVERCLOCK's Barlow Condensed Black Italic must NOT join that link — self-host its woff2 under `assets/fonts/` (check `.vercelignore`), `@font-face` in `css/overclock.css` (loaded lazily), `preload()` → `document.fonts.load` during the walk inside | `index.html:77` | no boot cost for a game's font | none | S |
| D11 | **FINE already**: QUIT TO THE ROOM (2B), BACK TO THE ROOM, both locks + banner names, the chips hook (`app.js:218`), the city pause through the podium + the moment (correct: an iPhone never holds both); `musicFor(game)` can return a mood station's `m:<file>` id (`music.js:33` registers them at run time) — the plan's "a random EVENING track each match" works through the plug (make sure the mood registry is loaded before a game asks; `prefetch(mod.MUSIC)` in `game-options.js:41` handles a static id only) | — | — | — | — |
| D12 | **THE CONTRACT TEXT GAPS** (docs/cartridge.md): which exports may be async (start only); `step` never awaits; `prepare` on the HOST only, `preload` on EVERY phone; a view never imports the city; `preload`'s budget; `finalRanks` of a 1-player match still returns a row; the daily as a solo room (D2); the "what plugs where" table (D5) | `docs/cartridge.md` | the Overclock chat stops reading pass logs for it | none | S |

---

## E. FREE-PLAN LIMITS + SIZE

Measured on the emulators + `serve.mjs --emu` (gzip like Vercel) with a CDP network probe: two phones, title → room → an OVERCLOCK match →
a PRISM DROP match → a reload, every Firebase WebSocket frame counted; `MEASURE=1 e2e-conn.mjs` (20/20) for the sockets; `git rev-list` +
`cat-file` for the repo. Vercel's Hobby figures below are from the 2024–25 pricing ("check" = confirm on the Usage page).

| what | the number | where it comes from |
| --- | --- | --- |
| DB sockets: parked title / room / game / a hidden room tab / /board / /admin / the admin's panel | **0 / 1 / 1 / 1 / 0 / 0 / 1** per phone | e2e-conn 20/20; `firebase.js:228–238`, `room.js:198, 349` |
| the socket ceiling | **100 phones in rooms at once** = 12 rooms of 8 (or ~50 rooms of 2) | the Spark limit |
| DB download, a quiet room | host **4.0 KB/min**, guest 2.7 (the host beat = an 82-byte frame every 2 s; the presence heal every 5 s) | the frame dump |
| DB download in a match | OVERCLOCK host 5.2 / guest 3.4 KB/min; PRISM DROP 12.4 / 11.0 (2 players; the live boards scale with players) | the frame dump |
| a 4-h night, 8 phones → the 10 GB/month | ≈ 77 MB (PRISM) / 10 MB (OVERCLOCK) → **≈ 130 PRISM game nights a month** — not a constraint | scaled from the 2-player run |
| `GET /api/admin?live=1` | every **45 s ± 10 %** while the city is visible (title AND room); `s-maxage=15` → the origin ≤ 4/min per edge region however many phones | `harbor/remote.js:107, 205`; `api/admin.js:274` |
| `/api/time` | **5 samples at boot + 5 "refine" at 7.5 s + 5 on every return from the background** (≥ 60 s apart), `no-store` → each an invocation; stops once a socket has been up | `firebase.js:104, 129–145, 168–172`; `api/time.js:6` |
| `/api/sky` | 1 at boot if the saved answer is > 30 min old, then every 15 min while visible; `private, max-age=600` → never edge-cached (correct: per IP area) | `district/live-weather.js:10, 59–64`; `api/sky.js:96` |
| `/api/board` | `s-maxage=20` (rows) / 120 (active) + a 12-s client memo → ≤ 3.5/min at the origin in all | `api/board.js:90–91`; `profile/api.js:46` |
| `/api/report` | 1 per phone per match; **a 425 "still settling" retries every 2 s with no cap on that branch** | `profile/queue.js:69–83`; `api/report.js:129` |
| `/api/log` | ≤ 8 per page load, each error once; 40/h/IP, 3,000/day — cannot flood | `errlog.js:7, 110–113`; `api/log.js:7` |
| invocations per phone-hour: title / room · in a game | ≈ 110 requests, **≈ 25–35 un-shareable origin hits** (time ~20, sky ~5, profile ~3) · **≈ 2–5** (the city destroyed → the poll stops; the socket's offset replaces /api/time) | the rows above |
| per month at 1 h/day, 1 / 10 / 100 phones | ≈ **9k / 50k / 280k** invocations (the limit 1M — check) | |
| **edge requests per visit** | **fresh 457 (366 ES modules under /js); a repeat ≈ 380** — `sw.js:22` fetches every same-origin file with `cache: 'no-cache'` (a 304 on Vercel is still a request) | the probe; `sw.js:22` |
| the edge-request allowance (1M/month — check) | **≈ 2,000 visits/month ≈ 65 visits/day** at 450–500 each (+ 110/phone-hour of polls) — **the tightest Vercel number** | |
| ONE fresh phone, title → room, 25 s | **17.6 MB: audio 14.6** (music 9–12 + the city's ambience 2.6), JS 2.66 MB gz (366 req), the SDK 118 KB gz, fonts 73 KB, CSS 72 KB, assets 36 KB, data 11 KB | the probe |
| …the music on arrival | **3 station songs WHOLE** (c2-day2 2.5 MB, c2-day8 1.9, c2-day1 1.8) + the room's lobby song (menu3 3.0): the synced player fetch()es + decodes the one playing, the next (≤ 45 s ahead) AND the previous (its fade tail) | `audio/synced-songs.js:26, 30–34, 59–66` |
| an OVERCLOCK match | **7.4 MB**: overclock.mp3 3.55 MB **fetched twice**, banks 237 KB, JS 58 KB, CSS 14 KB | the probe |
| a PRISM DROP match | 3.1 MB: prism5.mp3 3.0 + 50 KB JS (the 5-song playlist 13 MB in all, prefetched one ahead) | `music.js:296, 436` |
| the GUESTS sheet | 0.25 MB (vault JS 205 KB + vault.css 31 + progress.css 14), ~0 per extra strip | the probe |
| a whole 4.5-min session, one phone | **37–38 MB, 90 % audio** (33.6 MB in 61 requests — the host re-fetched c2-day2 4×, the guest 3×: the player is re-created after THE CITY PAUSE, `party-music.js:132–137`; locally `serve.mjs:48` is `no-store`, on Vercel `/audio/*` is `max-age=604800` — the browser cache SHOULD absorb it: verify on the iPhone) | the probe |
| music per phone-hour · the 100 GB ceiling | ≈ **50–60 MB** (a station song 2.4–3.3 MB ≈ 3–4 min at 112 kbps) · **≈ 1,700–2,000 phone-hours a month ≈ 60/day** (8 phones × 4 h × 8 nights = 15 GB fine; 100 visitors × 1 h/day = 170 GB over) | `data/mood-music.json` (city2: 57 songs, 162 MB) |
| the deploy | **≈ 296 MB static** (audio 278 + js 9.3 + assets 6.2 + the rest 2.3) → ≈ 30–33 deploys in 10 GB unless Settings → Deployment Retention is set (it exists — check the default) | `git ls-files` × `du`; `.vercelignore` (complete: nothing shipped is unloaded) |
| the repo | **377 MB pack + 69 MB loose (4,349 objects — no `git gc`) ≈ 446 MB**; audio 308 MB of the history (66 %), docs 50, screenshots 36, js 27, art 22; biggest blobs: ufo.glb 14.9 MB, **menu.mp3 × 5 versions = 30 MB**, harvest.glb 8.1 | `git count-objects`; rev-list |
| growth since FR5 (3.5 days) | **111 MB raw / 50 MB on disk** — docs 55 MB raw (harbor.md's + plan.md's histories 79 MB each: a 1-MB file edited nearly every commit), js 33, tests 10 → **≈ 14 MB/day → the 1 GB guideline in ≈ 40 days (≈ 12 passes)** | `rev-list d009377..HEAD` |
| untracked + UNIGNORED | **`shots/` 1.8 GB at the repo root is NOT in `.gitignore`** (`:9–10` cover `shots-*/` and `tests/integration/shots/` only) | `git status` |
| big but ignored / excluded | `tests/integration/node_modules` 532 MB, `art/` 385 MB on disk (25.5 tracked), `shots-*` ≈ 790 MB; **`screenshots/` 25.8 MB TRACKED, never served**; stray empty dirs `2/ 3/ 4/ 6/` | `du`; `git ls-files` |

| # | finding | gain | risk | size |
| --- | --- | --- | --- | --- |
| E1 | **EDGE REQUESTS — 450–500 a visit, the tightest number.** 366 ES modules on a fresh title; a repeat ≈ 380 again because `sw.js:22` revalidates every file (`cache: 'no-cache'`); the live poll adds 80/h, /api/time 10–20 a visit. Fix (no build step): (a) a `vercel.json` header for `/js/(.*)` + `/css/(.*)`: `public, max-age=300, stale-while-revalidate=86400` and the SW on the default cache mode (bust on a new build via the `v` that `GET /api/log` already returns — `scene.js:2357`); (b) later, ONE committed concatenated harbor bundle produced by a script in `scripts/` (not a deploy build) | a repeat 380 → ~20 requests; a fresh 457 → ~150 with (b) | ≤ 5 min of stale JS after a deploy with (a) alone | M |
| E2 | **THE MUSIC ARRIVES WHOLE, THREE SONGS AT A TIME, AND TWICE.** `synced-songs.js:59–66 wanted()` = the playing song + the next + the previous, each a whole-file fetch + `decodeAudioData` — 9.2 MB in the first 25 s of a fresh visit (a phone that leaves at 30 s paid for all of it; the direct `<audio>` path streams 206s). Over a session the host re-fetched a station song 4× and the game song 2× (the player re-created after the pause; two consumers for the game song). Music is 90 % of every byte — i.e. the whole 100 GB question. Fix: (a) skip the PREVIOUS song unless this phone decoded it (`bufs.has(keyOf(cur − 1))`) — S, −2–3 MB per arrival, inaudible; (b) keep decoded `AudioBuffer`s in a module-level cache across the city rebuild — S/M, −1 song per match per phone; (c) one fetch per song id shared with the tape-stop slice — M; (d) 96 kbps or ~2:30 trims for the 57 city songs (162 → ~110 MB) — M, the owner's ears | a fresh visit 17.6 → ~11 MB; 55 → ~40 MB a phone-hour | (a)–(c) none; (d) the look (sound) | S + S/M (+ M) |
| E3 | **`/api/time` is the biggest per-phone invocation source**: 5 samples at boot (the ≤ 30 ms early stop never fires on a phone network), 5 more at 7.5 s when the best was > 45 ms (nearly always), 5 per return from the background — a title phone that app-switches 6×/h ≈ 40/h, ~60 % of the un-shareable invocations at scale. Fix: 3 samples; skip the refine round when the boot's best < 80 ms; on "back on screen" re-sync only if the last sync is > 10 min old (`firebase.js:160` already keeps a faster one 10 min) | −60 % of the per-phone invocations | a slightly looser title clock (rooms use the socket's offset) | S |
| E4 | **`.gitignore` misses `shots/` — 1.8 GB untracked at the root.** `.vercelignore`'s `/shots*` covers it; `.gitignore:9–10` do not. One `git add .` turns a 446 MB repo into 2.2 GB that GitHub won't take (2 GB a push) and only a history rewrite undoes. Fix: `/shots/` (or `/shots*/`) in `.gitignore`; delete the stray `2/ 3/ 4/ 6/` | a 2-GB accident impossible | none | S |
| E5 | **The repo crosses 1 GB in ≈ 40 days; two-thirds is music that never changes.** Every replaced song keeps every version (`music.js:58 REV` bumps the URL; git keeps the blob — menu.mp3 × 5 = 30 MB); between music passes the docs are the engine (~15 MB a pass). Sized: (a) **Git LFS for audio — NO**: GitHub's free 1 GB/month LFS bandwidth is gone after two CI checkouts × 278 MB a pass unless the workflows set `lfs: false` (Vercel's integration DOES fetch LFS); (b) **A MUSIC BUCKET** (Cloudflare R2: 10 GB free, no egress; `audio/music.js` gets a base URL; CORS on the bucket for Web Audio; `sw.js` already passes cross-origin through): the repo −278 MB, the deploy 296 → ~20 MB (500 fit), and Vercel's bandwidth stops carrying the 90 % that is music — ONE move answers the repo, the deploy cap and the 100 GB; (c) a history rewrite for the 4 superseded menu.mp3s + the glbs (~50 MB) only together with (b); (d) `git rm screenshots/` (25.8 MB tracked, never served) + `git gc` (69 MB loose) | the three size ceilings answered at once | a second service, a CDN hop | (b) M · (d) S — the owner's decision |
| E6 | **The deploy: ≈ 296 MB, ≈ 30 fit** unless Deployment Retention is set; at ~2 tagged pushes a day the cap arrives in ~2 weeks, with a policy never. E5-b makes it moot | no "deployment storage full" surprise | none | S (a setting) |
| E7 | **Smaller**: `room.js:409–416 cleanupStaleRooms()` has no caller (dead; its query would download 20 whole rooms, games included) — delete; `profile/queue.js:83` the 425 retry every 2 s needs a cap (2, 4, 8 … ≤ 60 s — else 8 phones × 30/min on `/api/report` until MAX_AGE if a match never settles); `room.js:93` reads the whole `hush/` node on every HOST (bounded by the words rested in 24 h — fine) | — | none | S |

**Healthy:** the sockets exactly as designed (0 on a parked title, 1 in a room or game, a hidden room tab keeps it, QUIT + 30 s → 0, /board +
/admin 0, no `touch` leak, no extra socket for GUESTS / the profile / the lab / the crew's radio — they ride the room's); DB download tiny
(3–12 KB/min a phone; writes are diffs); the edge caching real where it matters (the live poll 15 s, the board 20 / 120 s + a client memo,
the lab export + the clip 60 s); `/api` never SW-cached, `sw.js` `no-store`, `/audio/*` a week + SWR a month; the code is small (2.66 MB gz
for the whole city, 72 KB CSS, 36 KB assets, banks ≤ 240 KB) — the bytes are all music; `/api/log` can't flood; `.vercelignore` complete.

**What to watch, monthly (5 numbers):** Vercel → Usage → Edge Requests (≈ 2,000 visits a month at 450; confirm the allowance there) ·
Fast Data Transfer (100 GB: expect ≈ 55 MB × phone-hours) · Function Invocations (≈ 25–35 a phone-hour + a 240/h floor while anyone is
on) · Firebase → Realtime Database → Usage: peak connections vs 100, downloads vs 10 GB · Vercel → Settings → Deployment Retention + the
storage line (≈ 296 MB a deploy) and `git count-objects -vH` (446 MB; 1 GB in ≈ 40 days).

---

## F. THE DESKTOP ITEMS

Judged at 1440×900 @1 (+ 2560×1080 for the wide composition) and a phone sideways (874×402 @3) from fresh loads — the screenshots in the
scratchpad's `A/out/` + `shots-desk/`. The desktop camera (F 725 at 1440, CAMH 8, cx0 0) and the resize (A6) are the only desktop-specific
costs found; the hover, Esc, the dock, the sheets' widths (a centred 520-pt column) are fine.

| # | item | what's wrong | where | the fix | size |
| --- | --- | --- | --- | --- | --- |
| F1 | **THE CUT-OFF SPEAKEASY at 1440×900** | the building's left third is off screen — the first window column + the door's left post clipped, the blade sign whole (`night-1440x900.png`, `day-1440x900.png`); WHOLE at 2560×1080, where the 2.2:1 composition frame + the fades take over | `core/harbor-layout.js:85 VPX: W / 2` (always centred) + `:84 cx0` (only above `DESK.wMax` 2.2:1) + `:76 F *= 1.4` — the closer desktop camera pushes a fixed world x past the edge between ~1.4:1 and 2.2:1 | shift `VPX` right on a wide screen so `project(cam, L.speakeasy.x0, …)` lands ≥ 12 pt in (one pass after `harborLayout`; the lanes / rects read `cam`), or start the composition frame earlier (a lower `wMax`) | S–M |
| F2 | **THE ROOM ON DESKTOP: the two lines sit in the left 16 %** — 8 figures ~30 pt at x 65–230 of 1440 by the clipped door, the dock 1,000 px away in the middle (`desk-room.png`); GUESTS + GAMES fine; the dock never over the people | `core/room-lines.js` (the lines at the door in world units — right by design) + F1's camera | F1's shift brings the door + the lines ~¼ in; on a wide screen let the lines fan wider (spacing × `cam.spread`, capped 1.5) | S (with F1) |
| F3 | **THE EMPTY PROMENADE**: people on the walk at the same moment — the phone **7** · 1440 **3** · 2560 **4** (`harbor().people.n`, 12 s after the reveal, a Tuesday 21:30): the desktop walk is ~3× the phone's width in world units (hw(50) ≈ 49.7 u vs ~16 u) with the phone's count | `core/harbor-people.js:109 mixNow` takes no width; `TIER_CAP` (`:53`) is per phone; `cam.spread` (`harbor-layout.js:89`, "the panorama factor, 1 on a phone") exists and is unused by the count | multiply `n` + the walkers' cap by `min(2.5, cam.spread)` on a wide screen (the plan's cost scales with it — A2's segRect; a desktop has the CPU) | M |
| F4 | **THE BENCH ON THE RIGHT at 1440** sits on the walk's top edge against the water's rail (x ≈ 1300, y ≈ 780) while the left bench (360, 800) is in the walk — reads as floating (the owner's screenshot, plan.md) | `core/harbor-promenade.js:99 bench: { f: 0.42, z: 47.8, face: 'water' }` + `:220 more.push({ x: x + 3.2, z: 46.6 })` — the extra benches every 4th tree at z 46.6, the walk's BACK line; on the desktop camera (eye 8, F × 1.4) z 46.6 projects onto the kerb | put the extra benches at the promenade's mid depth (z ≈ 44, the trees' band) or face them 'street' with a planter behind; check with `shots.mjs --sizes desk-pass --crop stage` | S |
| F5 | **A PHONE SIDEWAYS IN A ROOM**: TURN YOUR PHONE UPRIGHT covers the room; the GAMES sheet opens UNDER the card (`side-room.png`, `side-games.png`) — the host can't start a game sideways. By design until TV mode (SCHED's known issue) | `index.html` (the card) | nothing now; when the card comes off, the sideways room needs F1–F3 anyway | — |
| F6 | **THE RESIZE's ~0.5 s** — A6: the promenade re-planned + every band re-baked in one task | `scene.js:2729–2748` | A6's two steps | S · M |

---

## G. GREEN MEANS GREEN — THE TESTS + THE PASS OVERHEAD

Read: every pass log's Known issues + full-run sections since FR5 (18 logs), the checks' code, the last four full harbor runs' per-job times
+ annotations through `gh` (41780073566 lobby-2a · 41755209031 vault-2c · 41732225529 vault-2b · 41697838356 vault-2a — reads only; no
workflow triggered). Verdicts: TEST BUG / CITY BUG / PROCESS — never a widened tolerance.

| # | finding | verdict | the fix | gain | size |
| --- | --- | --- | --- | --- | --- |
| G1 | **F10 THE HALLOWEEN SPIDER TAP** — `holiday.mjs:74–80` waits for `spiders[0].mode === 'still'`, but a ROAM burst's pause is ALSO `still` (0.3–1.5 s, `dress-halloween.js:380`: move 0.15–0.5 s / still 0.3–1.5 s / move…), while the HUB still is 7–16 s (`:360`). On the 2-core runner the read → tap round trips (50–150 ms each at ~30 fps) land after a roam pause → `near()` misses (`:741`, d < 16 u; roam steps are 5–13 u) → DANGLE + CLIMB HOME fail after it. 2A's cloud text proves it ("turn → move, y 30.3 on the word" = never dropped). Red in CC-B, PERF-B, LOBBY 2.0 A. (FR5 D3's "18 s vs the 25-s re-poke" is ITS NERVES, `:123–134` — green in all four runs.) | **TEST BUG** | wait for the HUB still: `mode === 'still' && far < 1 && scared < 0.05 && crouch < 0.05 && !trip` (`far` is in `state()`, `:751`); read `spiderAt` from the predicate's last evaluation and tap at once; the same at `:109, :156, :164` | a red holiday job every ~3 passes gone | S |
| G2 | **THE RESIZE + LOAD WEATHER's holiday-night jump**, carried "known" VAULT 1A → 2C (six passes): 2A / 2B fixed NOTHING. LOAD WEATHER (`city.mjs:685 okT`: a 1,200-ms facade crossfade after the reveal) was fixed by LOBBY 2.0 A G0 (1bfa40b — the facade's blade memo keyed to the city clock): no `[timing] LOAD WEATHER` in run 41780073566 (it was in all three VAULT runs). THE RESIZE (`desktop.mjs:40–68`) was RE-SCOPED there: the drag's held frame < 200 ms (right — the visible quantity) and "the re-fit's one hitch < 750" — the re-fit (layout + the neon's 120–160 ms + every bake re-rastered in ONE task, 300–550 ms headless) is the standing city cost (F); 750 is a widened bar on it, tolerable only because it is labelled a known cost | LOAD WEATHER **CITY BUG — fixed Nov 4**; RESIZE **re-scope FINE, the re-fit a CITY cost** | slice the re-fit (F); a repeating `[timing]` warning is a red by another name — the "two passes" rule fired three times before anyone looked | — | M (city) |
| G3 | **SIGHTINGS compose < 12 ms** (`holiday.mjs:461`) times `composeCity` (`snapshot.js:12–34`: ~6 `drawImage`s of every layer into a 965² canvas at dpr 3, synchronously IN the frame — `scene.js:1512, 2949`) on the TEST MACHINE's software rasteriser: 6.5–15 ms by shard load, 12.7–13.4 on the runner. 12 is one PROGRESSION B run's number, not a phone budget (a 16.7-ms frame already holds the city's 8–18); the honest quantity is the check's second clause (`gaps.max`: no dropped frame between the tap and the capture), which has never failed | **TEST BUG** | drop `ms < 12`, keep `gaps.max`, print `ms`. Optional city headroom (M): the layer copies in-frame, the crop + `createImageBitmap` off-frame (the photo shows ≥ 300 ms later anyway, `sighting.js:219`) | one red full run in three gone (2B: three runs ≈ 6 min) | S |
| G4 | **"Passes alone" — the inventory** (18 logs): RESIZE ×7, LOAD WEATHER ×6, **THE BOARD's row check in `e2e-profiles.mjs` ×6 — every pass since VAULT 1A, never fixed (1A's log names the fix: seed a second listed player in the test)**, SIGHTINGS compose ×3, partysync ×4 (CITY — fixed in DESKTOP G2, 0 since), the storm's close strike ×4 (CITY, fixed PERF-B + seeded CC-B; lobby-2a still saw "A BUSY STORM" under load — watch), THE TAPE's WATCHDOG ×1 (PERF-B: "accept either recovery — next pass"; still open), four single okT misses. `okF` ×5 — none fired in four runs (healthy); `okT` ×36; `skipCI` ×3. **THE VAULT's 5 SPEED / FULL LOBBY `okT`s warn in ALL FOUR cloud runs** (`vault.mjs:128, 293, 481`: "2D at tier 2, 0 draws", 10–60 fps — the runner has no GPU path and cannot answer them, CALM LOAD's case) = 7 of the 9 warnings every run are noise | mixed | the board-row seed (TEST, S); the vault's five → `skipCI` (S); the tape watchdog's "either recovery" (S) | one re-run fewer a pass (~3–4 min); a readable warning list | S each |
| G5 | **WHY LOBBY 2.0 B's CLOUD RUN NEVER RAN.** `gh run list` has NO entry — not even a skipped one — for 6fa05ca or dbcd146 in EITHER workflow; `git log --name-status 6fa05ca..dbcd146` = `docs/harbor/passes/lobby-2b.md` only. GitHub evaluates `paths:` on the WHOLE PUSH's diff (`before..after`) and creates no run at all when nothing matches — that happens BEFORE the `if:` can see the tag. The push WAS one docs commit because every code group had been pushed untagged earlier — the pipeline's own shape. `tests.yml`'s `paths-ignore: docs/**` has the same hole → 2B's final push ran NO cloud test at all; a3a550f's deploy tag skipped by design. **The `room2` job has never run in the cloud.** | **PROCESS BUG** | drop `paths:` (harbor.yml:16–46) and `paths-ignore` (tests.yml:13, 15); read the tag from `github.event.head_commit.message` in the `if:` + the concurrency key (= Vercel's rule; immune to the 20-commit cap of `event.commits`). An untagged docs push = skipped (0 min, as today); a TAGGED docs-only push = the full run — the one the pass wanted. Cost: none beyond the run that should have happened | the one cloud confirmation a pass has | S |
| G6 | **THE RULES-LAG, made mechanical.** The 2B pattern is right for the stamps (`room-show.js#goOf :29–34`, `#backOf :37–45`, `host.js:155 stampRefused` → `:192 reportError('rules')`). But `oldrules` (`lobby2.mjs:473–476`) makes "the old rules" by deleting `meta.go / back / rv` from the CURRENT file — a hand-coded delta for THIS pass, kept current by nothing. And **23 client writes swallow a refusal** (`catch(() => {})`): `room.js:60` `players/{uid}/ln` (2A's node — a refused line = "a leave sends a guest across the door", silent), `room-city.js:81` the ring + votes clear, `host.js:60` `meta/hostBeat` (a refused beat = every guest deposes the host after 10 s — loud in effect, invisible in cause), `host.js:157` go:null, `lobby-music.js:55, 60` `meta/lm`, and **player ANSWERS**: `golf/view.js:257`, `pulse/view.js:309`, `signal/view.js:138, 155`, **`prism/view.js:447`**, `agent/view.js:428, 539` — a refused answer = "never answered", timed out by the director | **CODE BUG (a class)** | ONE place: `js/firebase.js:20 call()` is the path every write takes — a `writeCall` for set / update / remove / push / runTransaction catches `PERMISSION_DENIED`, reports once per path-prefix a session through `errlog.reportError(e, 'rules')` (→ /api/log → /admin), rethrows (every caller's own catch keeps working). Plus the fixture: `tests/fixtures/rules-live.json` = the rules AS LAST CONFIRMED PUBLISHED (the pass that gets "published" copies it); `oldrules` loads IT; `tests/rules-live.test.mjs` fails when `database.rules.json` ≠ the fixture unless `tests/fixtures/rules-live.ack` names the current hash + the summary's line ("RULES CHANGED: meta/go, meta/back, rv — the owner re-publishes") — the ack IS the reminder, in the unit suite before every push | never again a silent live failure (2B cost a hotfix, a cleanup script and three live rooms) | M |
| G7 | **TESTS + REPROS OFF THE LIVE SITE.** 27 scripts take `E2E_BASE`; `wk-room.mjs:10 PROD=1`; **`scripts/lab-export.mjs:11` DEFAULTS to `https://www.neonspeakeasy.com`** (a read); the only guard is the env var. The push fires at `createRoom` (`room.js:108–110` → `radioRoomOpened`; `radio.js:533–546`: mine + < 120 s + once per CODE + not the owner → every subscribed phone, at once, url `/?city=2`); NO test / silent flag exists (`op: 'test'` sends a real test push). And every seeded test phone with a saved name gets a real profile + MEMBER Nº at boot (`app.js:325 syncMe()` → `/api/profile ensure` → `profiles.js:106 memberNo`) — the 2B incident's five | **PROCESS + CODE** | (a) the harness, kit.mjs, wk-room, lab-export, shots: refuse a non-localhost base unless `I_KNOW_THIS_IS_LIVE=1 && TEST=1`; `TEST=1` → `&test=1` on every page → a session flag: `syncMe` returns null, `radioRoomOpened` carries `silent: true` and the server honours it (writes `sent/{CODE}`, pushes nothing — a non-cooperating client already silences it, no security lost); (b) the push's rules: the CLIENT fires from a 10-s timer after `enterRoom` (cleared by `exitRoom`), the SERVER wants `players ≥ 1` + the host's presence online, the url `/?room=CODE` → JOIN, or title.js:1831's existing "The room behind CODE has closed" | no more real pushes or member numbers from a test | S + S |
| G8 | **THE PASS OVERHEAD.** The full suite 20.1 (PERF-B) → 26 min (2B): 4 shards at 1,186–1,190 s (BALANCED — FR5's imbalance is gone) + **the SERIAL TAIL 396 s (panel 126 + perf 200 + oldrules 70)** = 26.4 predicted, 26 measured. The critical path is the tail + the shard count: 5 shards → 22.5 min, 6 → 19.9 (the memory ~16 / ~19 GB of 32 — PERF-A's "5 gave nothing" was the stale table). The cloud: 2A's run = 83 billed + tests 8 = **≈ 91 a pass** (+ `room2` ≈ 5 → ~97; the docs' "36–42" is stale ×2); the `lobby` estimate 505 s vs 215 real (DOM / Firebase groups run faster on the runner than raster ones). The /api tests + the profile E2E aren't timed in any log since PERF-B | overhead | (1) `oldrules` out of the tail — beside `panel` (its pages read the show, not `city2/live`; one line in e2e-harbor.mjs) or on its own emulator namespace → −70 s; (2) SHARDS=6 after one measured run → −6.5 min; (3) refresh `lobby` / `room2` SECONDS after room2's first cloud run; (4) G4's board-row fix → one re-run fewer; (5) nothing moves to cloud-only under the owner's rule — and the 2-core runner finds different things (every F10-class race): keep both, cut the tail | **a full local run 26 → ~18.5 min**; the cloud unchanged but it RUNS (G5); re-runs ~10 → ~0–1 min | S |

**Healthy:** the shard balance (67 groups within 4 s of each other); `okF` honest (0 of 5 fired in four runs), `okT` keeps its hard half hard;
the cloud's setup cached (annotations show only Node-20 / `setup-java@v4` deprecation notices — upgrade some quiet day); PERF-B's windows
pool, the `settled()` waits, the smoke's 8-s watch, `--no-audit --no-fund` all in place; the 2B stamp pattern (`oldrules` fails without it);
DESKTOP G2's party-sync fix held (0 misses since, 4 before); presence / CONN / the host claim: no "alone" failure since APP FIXES.

---

## H. CODE HEALTH since FR5

`602 files changed, 43,735 insertions, 3,788 deletions` in 196 commits (3.5 days). Most touched: plan.md 46, decisions.md 44, **scene.js 37**,
harbor.md 25, **title.js 23, css/vault.css 23**, harbor-schedule.js 20, lab-views.js 19, harbor-jobs.mjs 19, catalog.js 15. New: ~210 source
files — `js/fx/` (47), `js/vault/` (15), `js/progress/` (13), `js/profile/` (+6), the 9 `scene-*.js` cuts, 11 `radio*.js`, the 5 `room-*.js`,
14 `api/_lib/*`, 36 unit-test files. The standing-rule unit tests run here: harbor-remote, harbor-sched-strays, vault-names, cartridge,
test-browser, harbor-jobs → 25 pass; `doc-links` → 1 fail: decisions.md links `docs/harbor/review-6.md` (this file — green once it lands).

| # | finding | where | gain | risk | size |
| --- | --- | --- | --- | --- | --- |
| H1 | **THE SAVE-YOUR-KEY pop-up checks two classes that don't exist** (`.sg-shot`, `.vl-full-open` — nowhere in css/ or js/) and none of CUSTOMIZE (`.vl-dress`), the full card (`.vl-full`), the sighting pop-up (`.sg-modal`), the streak card (`.pg-sc`), the album (`.sg-big`) — it can open over the card the player is looking at | `js/profile/keypop.js:31` | the pop-up never lands on an open card | none | S |
| H2 | **ONE SHEET STACK covers 4 root classes; 5 body-level pop-ups bypass it** (`.sg-modal` z 9060, `.sg-fly` 9050, `.pg-sc` 9000, `.sg-big`, `.pg-pv` — fixed z, no `takeLayer`): a profile sheet opened FROM one of them lands under it — the Nov 4 bug one layer up | `js/ui/layers.js:31 POPUPS`; `progress/sighting.js:252`, `album-view.js:86`, `streak-card.js:31`, `preview.js:91` | every pop-up on one stack | none | S |
| H3 | **The force-flag test doesn't read the 8 City 1.0 modules the Harbor still runs** (`district/fx, stars, sun, fireworks, rainbow, frost, weather-fx, aircraft` — `fx.js:154–552` reads 9 flags through `s.force.has(…)`, `frost.js:135` one); all registered today (checked id by id: 0 strays), but a new one there would pass | `tests/harbor-remote.test.mjs:114–115` (dirs: screens/harbor + core/harbor-*) | the rule holds by test, not by luck | none | S |
| H4 | **THE CITY TIMETABLE's stray test skips two planners that still carry their own hours** — `core/harbor-promenade.js:317–318` (the density ladder `h < 1 / 5 / 7 / 10 / 16 / 20`), `core/harbor-speakeasy.js:52, 57, 121–122` (the lights' hours); `harbor-radio.js`, `harbor-room.js` unlisted too. FR5 C2a named both; SCHED moved the other ~20 | `tests/harbor-sched-strays.test.mjs:52–54 PLANNERS` (41 files) | the test says what it claims | none | S (the list) · M (the two migrations — they fail the test today) |
| H5 | **The start's push scales the dock's GLASS.** `.rc-pushing` is transform-only + `will-change` (good), but the pushed `.screen` still holds `.nd-bar-glass` (title.css:581 `backdrop-filter: blur(10px)`), `.nd-rejoin-btn` (:795) and the join panel (:824); `body.rc-going` hides only `.nd-actions` + `.rc-tags` (:1016). A backdrop-filter inside a scaling ancestor re-samples the moving backdrop every frame of the 650-ms push — the ONE non-"transform + opacity" cost in the show, the likeliest frame-eater on a 4-year-old phone (2B's own flag) | `js/screens/room-city.js:276–277`, `css/title.css:1016–1020` | the push at 60 fps on the old phone | none: `body.rc-going .nd-bar-glass, .nd-rejoin-btn, .nd-jpanel { backdrop-filter: none }` or hide the dock like the actions | S |
| H6 | **The OLD `.vl-e` emblems animate SVG children** — `.vl-e-neon.is-lead .n3 / .n2` (`<path>` opacity), `.vl-e-prism .p-sweep / .p-sheen / .p-glint` (`<rect>` / `<path>` transform): exactly what THE VAULT 2A's rule forbids (`emblem-art.js:150`'s own comment). `js/vault/emblems.js:28–49` builds them and is still imported by components.js, final.js, strip.js, picker.js, dress.js, full.js, lab-views.js | `css/vault.css:74–85` | no per-frame SVG repaint in a strip — or the file retired | low (first check which strips still reach `.vl-e` — `vault-preview.html` tells) | S–M |
| H7 | **FR5's dead code is still there, unchanged**: `signs.js:458 drawGooseneck / :492 lampLightMap / :513 lampGlows`, `water.js:80 wakes / :418 wake()` (nothing draws them), stale comments `clouds.js:18, :319`, `core/harbor-remote.js:29` (`&panel`), 7 of streetparty's 10 dead exports; **299 exports nothing imports + 401 imported only by tests** (FR5: 155 / 361 — both up; an identifier-presence scan, so 299 is an upper bound). New-code orphans worth a look: `room.js` `joinWait, LOCKED_MSG, cleanupStaleRooms` (E7), `room-banner.js` `PASS_MS, bannerName, flyBanner`, `progress/moment.js` ×4, `vault/full.js` ×4, `audio/party-music.js` `stationOf, stopPartyMusic` + 3 (docs/audio.md names `stationOf` — the doc is ahead of the code, or a caller was lost), `config.js` `APP_TAGLINE, APP_VERSION, signGames`, `core/sky.js` ×6, `core/progress.js` ×3, `core/streak.js` ×3 | §2 of the scan | less to read; one script pass | none | S |
| H8 | **THE SWITCH-OVER's deletion list, sized**: City 1.0-only = **≈ 4,370 lines / 285 KB** (9 `district/*` files, `lobby.js` 349, `core/street-life.js` 197, title.js's 25 `createDistrict` forks, `chat/ui.js#createChatStrip`, `profile.js#promptKey` (dead now: keypop.js "kept for nothing else"), 10 dead components.css blocks). **The Harbor STILL imports 13 district files (3,040 lines / 263 KB)** — `fx.js` 804, `sun.js` 619, `weather-fx.js` 386, `aircraft.js` 306, `rainbow.js` 277, `frost.js` 199, `stars.js` 186, `neon-ramp.js` 175, `marks.js` 167 (7 importers), `fireworks.js` 144, `palette.js` 100, `live-weather.js` 95, `backdrop.js` 92 — those MOVE (to `screens/harbor/` or `core/`), not delete. FR5 C2c's canvases outside the count in them: FIXED (PERF-B G5) | the list in the scan | a smaller site; title.js −25 forks | medium (the move is a design step) | L — THE SWITCH-OVER |
| H9 | **Two DECREASING per-tier values outside THE TIER TABLE** (PERF-B parked one; a second exists) + three boolean `tier === 0` gates in new cuts | `scene.js:1895` (`tier === 0 ? 0.8 : 0`), `water.js:227` (`tier === 0 ? 0.85 : 1`); `galesea.js:42/95`, `scene-legend.js:171`, `scene-party.js:29` | the rule, or a decided exception ("a fallback may fall with the tier") | none | S (a decision + 2 rows) |
| H10 | **The night's champion's 12 h lives in a screen file** (`CHAMP_MS`, `PASS_MS`, `WAIT_TRIES / WAIT_MS`) while every other room number is in PURE `core/room-show.js` | `js/screens/room-banner.js:19–21` | one home for the room's numbers (and a unit test can reach it) | none | S |
| H11 | **Esc has 7 handlers; only pfs / dress / full ask `isTopLayer`** — `settings-panel.js:236` (document-level, forever), `album-view.js:90`, `radio.js:145`, `remote.js:561` close themselves whatever is on top. And the sheets: **4 builders** (`.modal > .sheet` ×8 users, `openPfSheet`, dress.js + full.js's own roots, the 5 free roots) unified from outside by `watchLayers` | the list | one Esc in layers.js closing `open.at(-1)`; `openPfSheet` as the body for the `.modal` users (M) | none | S (Esc) · M (one sheet) |
| H12 | **Dead CSS**: `components.css` carries the pre-PROGRESSION profile's blocks — `.title-help` (:795), `.pf-streak / .pf-flame` (:1437–1443), `.pf-goal*` (:1444–1449), `.pf-holo`, `.fin-1…4`; `progress.css .pf-acc-key` (~16 lines; screens / title / vault / radio.css: 0 unreferenced); the toasts: the lab's own `vl-toast` (`lab-views.js:353`) → toast.js; `party.js`'s `PARTY_START_H / END_H` dead (good — the row is the one definition) but `party.js#partyHour / inPartyWindow` still hard-code 20 → 26 for 10 importers → read the row | — | — | none | S |

**The counts FR5 flagged that GREW** (none a bug; each the next quiet pass's mechanical S–M): `createRadialGradient` 309 sites / 118 files
(was 190 / 74); `clamp01` copies in 118 files (88); `smooth` 49 (30), `mix` 28 (20), `lerp` 24 (14); mulberry32 in 18 files (5); `PT.on >` 35
sites; `harbor-people.js` imported back by 20 harbor-* modules (11).

**Files too big to work in safely.** `scene.js` **3,127 lines** (FR5 3,891; SCHED's log says 2,968 — **+160 since**): one closure
`createHarbor` (:173–3127) — 161 functions, 111 `let`s, 133 imports, a 73-key API; SCHED did the 7 cuts + quartered `draw()` (`drawSky` 102
lines, `drawCity` 133, **`drawHarbor` 285**, `drawWeather` 66). Next, by its markers: the camera + layout + bake plan (:516–1113, `layout()`
87 → `scene-layout.js`), the Blackbird / Mothman / TR-3B blocks (:1113–1386 → scene-legend), **`tagBand()` 281 lines** (its own file),
`raidSounds` 87 (→ sounds), `drawHarbor` (→ `scene-harbor.js`), the API (:3020–3127). `title.js` 2,042: `createTitle()` (:340–2042) one
closure, 1,321 lines at depth 2, 40 `let`s; markers :505 the sequence, :898 THE NEON COMES ALIVE, :1078 THE RACE, :1141 THE MUSIC, :1441 the
games sheet, :1459 the living city's taps, :1684 THE DOCK (title-dock.js exists — the rest goes there), :1935 unmount — first the 25 City
1.0 forks (the switch-over), then `title-neon.js` (:898–1141) + `title-taps.js` (:1459–1684). `core/harbor-people.js` 1,594 (PURE; THE
BLOCKS :752–1349 → `harbor-people-blocks.js`). Also `folk.js` 1,489 · `components.css` 1,483 · `neon.js` 1,220 (FR5's 27 tier literals
still) · `clouds.js` 1,086 · `legends.js` 1,068 · `window-paint.js` 1,029 · `remote.js` 1,004 (13 markers — cut-ready) · **`css/vault.css`
978 / 129 KB** (lab + cards + emblems + glows in one sheet → `vault-lab.css`). **The new code is small**: room-city 354, app 350, host 216,
fx/renderer 258, lab-views 367, progress/profile 97, layers 43, room-show 151 — the growth went into many small modules, not into scene.js
(except the +160 it took back).

**FR5's follow-through.** TOP 10: #1 pixel watch ✅ (perf-a G2) · #2 SECONDS + fireworks, SHARDS=4 ✅ · #3 LOAD WEATHER's share step ✅
(`rebakeLights`) · #4 the five test bugs ✅ · #5 the phantom 2D engine ✅ (`fs.noFireworks`) · #6 the windows pool ✅ (perf-b) · #7 `localParts`
✅ · #8 the Christmas wire ✅ · #9 the profile / tab scare ×4 ✅ (a2b236d) · #10 the scene.js split ✅ (perf-b + SCHED) — **grew back +160**.
Sections: A4.1–A4.4 ✅ except **A4.4 the per-frame gradients in `draw()`**; B3 ✅; C2a ✅ (the pre-Oct-29 sweep PARTLY — H4); C2b ✅ except
the skybeams' decreasing value (parked) + `water.js:227` (H9); C2d + C2f ✅ (the district gap — H3); **C3's H2 / H6 / H7 / H10 NOT DONE and
grew**, H9 `harbor-traffic.js:37–40` still "mirrors", H11 `stage.js:82–105` vs `street.js:143–175`; H18 the frost pane ✅; **C4 dead exports +
comments + the wake + the lamp painters NOT DONE** (orphans 155 → 299); D1 / D4 / D5 ✅; E1–E6 ✅. PERF's PLAN: G0–G5 ✅ (minus the people's
plan warm-up; the dancers' cache DECIDED against); "Later": the legacy painters' tier sweep, H6–H11, the exports — not started.

**LOBBY 2.0 B's three flags for FR6.** (a) **ONE SHEET STACK's watcher** (`layers.js:34–43`): one `MutationObserver` on `<body>`,
`childList` only — per mutation `addedNodes.matches('.modal, .pfs, .vl-dress, .vl-full')` + no `data-layer` → `takeLayer`; removed → release.
Cost trivial (body's children change rarely); no false positive today; the false negatives are H2's five roots; a `.modal` HIDDEN but kept
would hold its layer — all eight users `remove()` after their out-animation; `z` resets only when the stack empties (a leak only stacks
higher — harmless). Esc: honoured by pfs / dress / full only (H11). **Sound; S to finish.** (b) **The start's push** (`room-city.js:253–297`,
`title.css:1016–1026`): every part a CSS animation at a negative delay (a refresh lands on the same frame — right); `.rc-pushing` scales two
layers (`.screen` + `.nd-scene`) about the door, one `getBoundingClientRect` per layer per start (read once); the veil, the sign's power-off,
the logo's power-on opacity-only; the city keeps drawing under the scale. What repaints: the tube logo injected mid-push (one layout —
fine) and **the glass (H5)**. (c) **The city's rebuild after a match**: `title.js#unmount` (:1935–2020) removes every listener `mount` added
(14 of them) and clears every timer — **matched 1:1**; `scene.js#destroy` (:3096–3109) removes its 7 + the watchdog — matched; the only
module-level registration across `screens/harbor/*.js` + `title.js` + `room-*.js` is `report.js:30` — inside the hang-watch worker's
template, once per page by design; `radio.js`'s 3 document-level listeners go in `destroy()`. What survives a rebuild ON PURPOSE: 35
module-level caches (bakes, `tree-model.js comp`, `fx/kit.js` sprites) — all through `ctx2d` / `safeCtx`, counted by the memory guard;
that is the rebuild's speed. **Clean. The open item is 2B's own: the rebuild isn't sliced (a perf item — A).**

**Healthy (don't touch):** the room's shows PURE + stamp-driven (every phone the same frame from `meta/go` / `meta/back` / the night's
entry; the hotfix's fallbacks keep it on old rules; tested); THE CARTRIDGE PLUG; the client writes nothing it shouldn't (profiles / XP /
items / sightings / boards only through `/api`; the room's writes match the rules row for row); ITEM NAMES ONLY TO OWNERS holds by test over
every shipped file; every canvas in the city, the fx library and the new screens counted (FR5 B3 closed); `fx/renderer.js` is ONE renderer
(surfaces + slots) with its tiers from THE TIER TABLE and a probation guard — the design FR5 asked for; THE WIND, THE TIMETABLE (41
planners), THE SOLIDS, THE LIGHT, the force registry: one source each, 0 strays in anything built since FR5; the emblem system (`<i>`
layers, transform + opacity, THE PROMINENCE RULE); the teardown 1:1; the new files small and single-purpose; the tests grew with the code
(36 new unit files, the room2 / vault / radio / lobby groups).

---

## FR6 FIXES' PLAN (the order; each group fits a pass of ~3–4 h — split where marked)

**Group 1 — THE OWNER's OWN (left open: the chat adds his LOBBY 2.0 B review notes here).** From his Nov 4 checks (plan.md "OWNER'S NOTES —
NOV 4 (late morning)"): THE DOGS FLASH DIFFERENT COLOURS while walking (one look per dog + a test that a walking dog keeps it); THE BLACKBIRD's
SIGHTING POLAROID framed the vapour cone, not the jet (the photo frames the JET at the tap moment; every fast legendary checked — the
Blackbird, the F-22 flyby, the fireball); the room push's rules (b of #5). + whatever his checklist adds.

**Group 2 — WHAT A PLAYER COULD LOSE OR MEET + THE SILENT FAILURES (~4 h; split at the line if needed):** #1 C1 the blank profile's items +
C2 the restore's old key, #2 G6 the one write path + `rules-live.json` + the ack test (+ C7's three), C3 the PRISM rush bound, C5 the admin
pid, C4 + #4 G7 the push's limits + the test flag + the live-site guard, E4 `/shots/` in `.gitignore` (+ the stray `2/ 3/ 4/ 6/`), C8 the logs
pruned on write, the `fb.js:41` pepper note in docs/profiles.md. — #5 THE CONSOLE's FLOWS (B): B1 `layers.js#closeAll()` at the stamp (+ B7
on a kick), B4 the in-flight promise in `startGame`, B2 the toast + the stamp cleared when a start dies, B3 the veil held while `meta.go` is
set (with B2's clear), B5 keypop's covered list (= H1), B6 OVERCLOCK's `write()` null guard. Proof: `server.test.mjs` (the restore keeps a
sighting card; the rush bound; the push bucket), `rules.test.mjs` (one default-deny case for `flags/ rl/ results/ errlog/ phonelog/ gplay/
wx/`), the new `rules-live.test.mjs`; the harbor `gamestart` group gains "a sheet open at the start is gone" + "a double-tap on REMATCH = one
match" + "a start that dies says so"; `wk-room.mjs` once in WebKit.

**Group 3 — GREEN MEANS GREEN + THE CLOUD (~3 h):** #4 G5 the trigger (harbor.yml + tests.yml), #9 G1 the spider's hub still, G3 the capture's
clause, G4 the board-row seed + the vault's five `skipCI` + the tape watchdog, G8 `oldrules` beside `panel` + one measured SHARDS=6 run (+ the
`lobby` / `room2` SECONDS refreshed after the cloud run), A7 `roomperf` on a kept party clock (a preview link keeps its flags in a room) + the
missing A1 row measured (+ WebKit once). The pass's tagged push = the first cloud run of 2B's code AND this: read it job by job.

**Group 4a — THE PHONE's SPEED (~3 h):** #6 A2 the people's plan one block a frame (+ `meta/back` + `status` in one update; the sky first),
A6 / F6 the visits kept on a resize, A3 the laser's `parseColour` + stop caches, H5 the glass off during the push, #8 E2 a + b the music, E3
`/api/time`'s samples. Proof: the rebuild's long tasks in `citypause` (a budget line), the baseline guard, the vault bench, the bytes probe.

**Group 4b — THE DESKTOP (~2 h):** F1 `VPX` on a wide screen (the speakeasy whole from 1.4:1 up), F2 the lines fan wider, F4 the extra benches'
depth, F3 the people's count × `cam.spread`; `shots.mjs --sizes desk-pass` + `ONLY=desktop`.

**Group 5 — THE CONSOLE's SEAMS (~3 h; or SHELL 2.0's Group 0):** H1 keypop's classes, H2 the five roots on the stack + H11 one Esc in
layers.js, H10 `CHAMP_MS` → room-show.js, H4 the strays test's list (+ the two planners' hours → the timetable), H3 the district dirs in the
force test, H9 the two decreasing tier values (a decision + two rows), D5 the registration checker, D4 `start()`'s `at()`, D12 the contract
text, H7 one un-export pass + FR5's dead painters, H12 the dead CSS + the lab's toast → toast.js.

**Group 6 — #7 E1 EDGE REQUESTS (M)** — its own short pass or SHELL 2.0's: the headers + the SW's cache mode + the build-id bust; verify
on Vercel (a repeat visit's request count) — before launch (C3 HARDENING), not urgent without traffic.

**BEFORE SHELL 2.0 / OVERCLOCK vs what can wait.** MUST land before SHELL 2.0 starts: Groups 2 + 3 (the data, the standard, the cloud). SHELL
2.0 itself must SETTLE #10: D1 (the thin meta + lazy logic — the registry's shape), D2 (the daily as a solo room: the code namespace + rules),
D3 (the SOLO lane in `extractMatch` + the server; the owner's streak decision), D7 (per-player memory: the digest in `players/{uid}/mem` +
`start({ memory })`), D8 (the podium's owner), D9 (the keypads + the timer into the kit) — a questions round with the Overclock chat BEFORE
SHELL 2.0's prompt. For OVERCLOCK pass 1's prompt: D6 (the bounds + the fixture move with the scoring), D10 (the font self-hosted + lazy), D5's
checker green. CAN WAIT: E5 (the music bucket — decide when `git count-objects` nears 700 MB or before the first music pass), E6 (a retention
setting), F3 (the desktop's people), C6 + C10 (decisions), H8 (THE SWITCH-OVER's list — ≈ 4,370 lines to delete, 3,040 to move), the
grown counts (gradients, clamp01, mulberry32 — a quiet pass).

## What's healthy (what NOT to touch)

- **THE CITY PAUSE** — destroy + rebuild: 70 MB → 0.2 MB, no timer, no GL, no rAF left; eight cycles leak nothing. Only its rebuild's
  FIRST seconds need work (#6), never the decision.
- **THE ROOM's SHOWS** — PURE, stamp-driven (`core/room-show.js`): every phone the same frame from `meta/go` / `meta/back` / the night's
  entry; the hotfix's fallbacks keep it on old rules; tested. The tags' loop, the hit boxes, the dock's repaint cost nothing.
- **THE CARTRIDGE PLUG** as built — REQUIRED / OPTIONAL as data, the pure checker on the real modules, the console grepped for game ids,
  `start({ now })` + the stamp-first start, `warm()` + `preload()`. Extend it (#10); don't rewrite it.
- **The server**: every grant and result recomputed server-side, exactly-once keys everywhere, the roles per action + the audit, push keys +
  subs never leaving the server, the root default-deny, `ensure` never overwriting a key, BRING YOUR CARD. Two S holes (#1, #2), not a design flaw.
- **THE EFFECT LIBRARY**: ONE renderer, its tiers from THE TIER TABLE, a probation guard, 0 slots = 0 work, the surface freed with its host;
  the emblem system on `<i>` layers; THE PROMINENCE RULE as the budget. Only the laser's two caches (A3).
- **Every canvas counted** (FR5 B3 closed), **every standing rule** holding in the new code (the timetable's 41 planners, the tier table, the
  force registry, names only to owners, no static SDK import, no layout read in a frame path, pointerdown everywhere).
- **The sockets + the database**: 0 on a parked title, 1 in a room, 0 after QUIT; 3–12 KB/min a phone; the edge caching real where it
  matters; `/api/log` can't flood; `.vercelignore` complete.
- **The tests**: the shard balance (67 groups within 4 s), `okF` honest, PERF-B's windows pool + `settled()` waits in place, the 2B stamp
  pattern proven by `oldrules`, DESKTOP's party-sync fix held, no "alone" failure in presence / CONN / the host claim since APP FIXES.
- **The teardown** of the title + the scene (1:1) and ONE SHEET STACK's watcher (childList-only, free) — finish the stack (H2), keep the design.
- **The new code's shape**: many small single-purpose files (room-city 354, room-show 151, layers 43, host 216, fx/renderer 258); the tests
  grew with it (36 unit files, the room2 / vault / radio / lobby groups).
