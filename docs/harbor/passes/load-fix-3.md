# LOAD FIX 3 — THE FREEZE + the city's music on the tap + THE APOSTROPHE TUBE + NO BLACK TILES (Nov 10 2026; plan.md "OWNER'S NOTES — NOV 10")

> The owner's iPhone, Safari, home Wi-Fi: THE SITE SOMETIMES FREEZES COMPLETELY WHILE LOADING — intermittent, most loads fine, since LOAD FIX 2's
> deploy (Nov 9 evening) or around it. A short City 2.0 pass between HOLD'EM passes (HE3 done, HE4 waits). ONLY the four items below — nothing
> else was started. No database rules change (PFIX-B's change of Nov 10 still waits for the owner's re-publish).

## Group 1 — THE FREEZE: reproduced + found (no fixes)

**The tools (new, local only):**
- `tests/integration/kit/line-proxy.mjs` — THE LINE: a proxy in front of `serve.mjs` that plays Vercel's caching (an ETag + `max-age=0,
  must-revalidate`, a 304 on If-None-Match — the local server says no-store) + a phone's line (`rtt` a request, a shared `mbps`), and the
  faults: `drop` (a share of requests whose socket is destroyed — a flaky Wi-Fi), `fail` (the first n requests matching a pattern dropped),
  `stall` (never answered — the socket left open; `stallN` = only the first n), and THE DEPLOY SWITCH (the upstream moved mid-visit — A → B).
- `tests/integration/wk-freeze.mjs` — THE FREEZE LOOP in Playwright's WebKit, 402×874 @3 as an iPhone: each run a fresh context, a COLD load
  then a WARM one (the HTTP cache + — `--sw` — the service worker in place, as on the phone; localhost skips the registration, so the test
  registers sw.js itself), each timed to THE REVEAL + THE FIRST WORKING TAP (BOARD → THE BOARD on screen). A FREEZE = no reveal in 10 s, or a
  tap the page never answers; each saved (a screenshot, the console, the requests still open, the boot's stage, the LOAD LOG). `--cpu n` = a
  main-thread hog that leaves 1/n of the thread (WebKit has no CPU throttle); a heartbeat records every timer gap > 250 ms (a long task).
  `--skew` (THE DEPLOY SWITCH mid-load + between loads), `--fail` / `--stall` / `--drop`, `--x-fail` / `--x-stall` (another host: Google's
  fonts, the Firebase SDK, sign-in — through the browser's router), `--junk` (every stored key set to junk), `--live` (LIVE=1 — the live site,
  read-only, `&test=1`).

**1. THE BOOT PRELOAD on WebKit — 30 COLD + 30 WARM, at LOAD FIX 2's parent (f5e2ee59^ = 1b773a20, a worktree on :5174) and now (4c945a65)**
— the same machine, the service worker on:

| run | the parent (before LOAD FIX 2) | now (LOAD FIX 2 deployed) |
| --- | ---: | ---: |
| 3× CPU + 40 ms / 40 Mbps — freezes | **0 / 60** | **0 / 60** |
| … the reveal, cold / warm (median, worst) | 5.45 s (5.88) / 5.40 s (5.66) | 6.01 s (8.11) / 5.97 s (6.49) |
| … the first tap (median) | 0.43 s | 0.42 s |
| no throttle — freezes | **0 / 60** | **0 / 60** |
| … the reveal, cold / warm (median, worst) | 2.70 s (2.78) / 2.66 s (2.75) | 2.60 s (2.95) / 2.67 s (3.02) |
| … the first tap (median) | 0.14 s | 0.13 s |
| the main thread's longest gaps (3×, cold) | — | 0.93 s once, the rest ≤ 0.54 s — ALL before the reveal, none after |
| THE LIVE SITE (LIVE=1, read-only, HTTP/2 + the real service worker), 10 + 10 | — | **0 / 20**; 2.13 s cold, 1.66 s warm |

**THE PRELOAD ITSELF NEVER FROZE A LOAD** (180 loads on a healthy line). WebKit fetches each of the 300 preloads ONCE (the import reuses it —
counted per file through THE LINE: 310 module files, 310 requests, the same as Chromium; its "preloaded but not used within a few seconds"
console warnings are noise). On the 3×-CPU + 40-ms line the reveal is ~0.5 s SLOWER now (the 300 preloads queue on the local HTTP/1.1
server's 6 connections ahead of the scene's own requests); unthrottled the same.

**2. A DEPLOY MID-VISIT (version skew)** — THE LINE on version A (the parent) switched to version B (now) at 0.15 / 0.4 / 0.7 / 0.9 / 1.5 / 2.5 s
into a cold load, then a warm load on B (the service worker's cache holding A): **26 loads, 0 freezes** — these two versions' modules happen to
link with each other (LOAD FIX 2 only added exports). The MECHANISM is real all the same: no module URL carries a version, so a load that
straddles a deploy can mix two deploys' files; and the service worker answers a FAILED network fetch with its cached copy — of whatever deploy
last cached that file — so a flaky line right after a deploy can mix them too. A mix whose exports don't line up = a SyntaxError at link =
the same frozen boot screen as below. Not reproduced as a cause; covered by Group 2's net.

**3. A FAILED OR STALLED REQUEST — THIS REPRODUCES** (each case on the line at 20 ms):

| the fault | the parent | now |
| --- | --- | --- |
| ONE failed request for `js/errlog.js` (the app's first import) | **HELD BOOT SCREEN forever** — 2 / 2 | **HELD BOOT SCREEN forever** — 2 / 2 |
| one failed request for a city module (`harbor/meteors.js`, `core/harbor-light.js`) | recovers (title.js tries the city's module again after 1.5 s) | recovers |
| one failed request for a module the preload fetched first (`js/config.js`) | (the import's own request — fatal) | **recovers**: the import asks again (WebKit's preload is a cache warm-up, not the module map) |
| RANDOM 2 % of requests dropped, service worker on, 8 + 8 loads | **2 frozen** (NO REVEAL — the city's module failed twice: THE CITY COULDN'T LOAD) | **2 frozen** (HELD BOOT SCREEN forever — `js/app.js`, `js/ui/tapwatch.js` failed) |
| random 2 % dropped, NO service worker (a first visit), 4 + 4 | — | **2 frozen** (HELD BOOT SCREEN — `js/errlog.js` …) |
| a core module that NEVER answers (`errlog.js` stalled) | — | HELD BOOT SCREEN forever |
| a city module that never answers (`harbor/meteors.js`) | — | HELD BOOT SCREEN (app.js waits ≤ 30 s for the city's module, then the bare shell) |
| a core sheet that never answers (`css/title.css`) | — | the city at 7.5 s but **DEAD TO TAPS** (no dock styles) |
| `/api/sky`, `/api/time`, `/api/daily`, every `.json` stalled | — | fine (3.5–6.0 s) |
| every image failed / stalled, our own fonts stalled | — | fine |
| Google's fonts / the Firebase SDK / sign-in stalled or refused | — | fine (no fonts: +2 s) |

**4. Back / forward + a tab coming back** — WebKit + Chromium: BACK after another page is a FRESH load (the page is never kept in the
back-forward cache — `persisted` false) → the city again, taps fine; Chromium's FROZEN lifecycle 20 s → active: 61 fps, the tap fine.
**Doesn't reproduce.**

**5. The main thread** — the heartbeat's gaps (above): the longest 0.93 s (3× CPU, before the reveal), none over 0.5 s after it in 120 loads;
no multi-second block anywhere. **Doesn't reproduce as a freeze.**

**3b. A stored setting from an older version** — every key the app reads (37, the profile + the session) set to `{`, `null`, `[]`, `"x"`,
`1e400`, `{"a":{"b":1}}`, `true`: 14 loads, all revealed + tappable. **Doesn't reproduce.**

**6. THE HANG WATCH starts too late — CONFIRMED** (read in the code): `harbor/report.js#createReporter` is made at the END of `createHarbor`
(scene.js) — a page stuck before the city (the boot screen held, a module graph that never ran) has no worker, no beat, no report.

**THE FINDINGS — the most likely cause of the owner's freeze:** **ONE failed or never-answered request among the boot's ~310 module files.**
The app's own graph (`js/app.js` + its ~113 static imports) loads as ONE unit: a single file failing = the graph never runs = nothing in the
app ever starts — no reveal, no error shown, no report, no retry: the boot screen breathes "STEPPING INSIDE" FOREVER. A city module that
never answers holds it ≥ 30 s; a core sheet that fails counted as "in" anyway (`onerror` → `__cssDone`) → a city with no dock styles, dead to
taps. Nothing in the page can notice, because everything that could is a module. On the owner's iPhone the trigger is ordinary: a Wi-Fi
blip, the screen locked or the app switched mid-load (iOS fails the open requests), the edge cold right after a deploy — on ~310 requests a
load, a tiny per-request failure rate is a few loads in a hundred ("intermittent; most loads are fine").
**Did LOAD FIX 2 bring it?** The trap is OLDER (the parent froze on the same one failed request). LOAD FIX 2 changed WHICH failure hurts: the
300 preloads make most modules' failures harmless (the import asks again), but the ones the module loader fetches itself before the preload
starts (app.js's first imports) still kill the load — and at a 2 % drop the live build's freezes are the SILENT kind (the boot screen held
forever), where the parent's were the city's "couldn't load" sheet. Whether LOAD FIX 2's one burst of 300 requests also raises the failure
rate on Safari's own stack (HTTP/2 + the service worker on a real phone) can't be measured here — the fix doesn't depend on it.

## Group 2 — THE FREEZE, FIXED + THE BOOT SAFETY NET (no look change)

**The root:** nothing in the page could notice a boot that stopped, because everything that could was a module in the graph that failed. So
the net is INLINE in index.html (a classic script, ahead of every module, the preload + the sheets — `tests/boot-watchdog.test.mjs` keeps it
there), plus the three places a single failure used to end a load:

1. **THE BOOT WATCHDOG** (index.html): the app's module graph failing to load (the `<script type="module" src="js/app.js">` error event) or to
   LINK (a SyntaxError before the app ran — two deploys' files) → AT ONCE; otherwise no reveal after **12 s ON SCREEN** (counted only while
   the page is visible — a locked phone isn't a hang) → a **BOOT HANG** report to /admin → "Reports from phones" (kind `boot`, its own row
   BOOT HANG: the stage it reached — html · app · the city's module in · the city started —, the core sheets, the boot preload's modules that
   never arrived (the resource-timing buffer raised to 1500 — 250 by default cut the list), the errors it caught (failed scripts / sheets /
   preloads by name, script errors, rejections), the screen, online, the service worker, whether it reloaded before; the server adds the
   version + the browser; no ids), then it RECOVERS: the app reveals what is ready (`window.__bootOut` — app.js: the city's module in + a
   screen under the boot screen) or, when it can't (the graph never ran, the city's module never came, a core sheet missing), **ONE reload**
   — never two without a reveal between (sessionStorage `ns:boot-re`, cleared by a reveal; no session storage = no reload) — and after that
   **TAP TO TRY AGAIN** on the boot screen (pointerdown + pointerup → a reload). On a LINK error the boot's ~300 module files are first asked
   for afresh (`cache: 'reload'`, ≤ 4 s): WebKit's reload alone reused the cached copy of the other deploy's file.
2. **THE HANG WATCH AT BOOT**: its worker is made by the same inline script from the first parse and beats from there (the boot's own
   snapshot); the city's scene hands it its snapshot + frame marks when it starts (`harbor/report.js` uses `window.__boot` — ONE worker; a
   page without index.html's script, a preview, keeps its own). A main thread stuck BEFORE the city now reports too.
3. **THE CORE SHEETS** (index.html): each counted ONCE (`__cssDone(this)` — WebKit fires a second `load` when a sheet's media flips print →
   all, so the count reached 4 with `title.css` still missing: a city dead to taps); a sheet that FAILS is asked for once more (`__cssFail`,
   `?again=`) before it counts. A sheet that never answers keeps the boot screen up → the watchdog's reload.
4. **THE CITY's MODULE** (title.js): three tries (1.5 s, then 3 s apart — the browser asks again only for the files that failed), then the
   watchdog's ONE reload (`__boot.reload`), and THE CITY COULDN'T LOAD + RELOAD only after that.
5. **THE SERVICE WORKER** (sw.js): a failed network fetch gets ONE more try (250 ms later) before the cache's copy — which may be an older
   deploy's (THE VERSION SKEW's other door).

**THE BOOT PRELOAD stays as it is** — it never froze a load (Group 1: 0 in 180), and in WebKit it HELPS (a failed preload is fetched again by
the import). THE BOOT BUDGET unchanged (the load group: 333–340 requests, ~2.7 MB — ≤ 360 / 2900).

**The proof** (WebKit, wk-freeze.mjs; the reveal now = the city shown AND the boot screen lifting — a city shown under a held boot screen is
no reveal):

| run | before (LOAD FIX 2 deployed) | after |
| --- | --- | --- |
| 30 + 30, no throttle | 0 frozen; 2.60 / 2.67 s | **0 / 60**; 2.61 / 2.43 s, the tap 0.13 s |
| 30 + 30, 3× CPU + 40 ms / 40 Mbps | 0 frozen; 6.01 / 5.97 s | **0 / 60**; 6.45 / 5.66 s, the tap 0.40 s |
| the deploy mid-visit (A → B at 0.7 s, then a warm load on B), 8 + 8 | 0 | **0 / 16** |
| RANDOM 2 % of requests dropped, service worker on | **2 / 16 frozen forever** | **0 / 20** (127 requests dropped) |
| one core module FAILED (`errlog.js`) | held forever | **3.6–4.0 s** (the at-once reload) |
| THE VERSION SKEW (`config.js` from another deploy: APP_NAME renamed) | held forever | **7.2–7.6 s** (re-fetched + the reload) |
| a core module never answers once | held forever | **15.4–15.9 s** (12 s + the reload) |
| a city module never answers once | held ≥ 30 s | **14.7–15.1 s** |
| `title.css` never answers once / fails once | dead to taps | **14.8 s** / **3.9 s** (asked for again — no reload) |
| a core module never answers EVER | held forever | **TAP TO TRY AGAIN** after the one reload (no loop) |

The harbor `load` group (Chromium) — **THE BOOT SAFETY NET**, each fault forced once on a fresh cold page through the test's own router, each
must end REVEALED + the first tap answered (BOARD): a core module failed (1.9 s, the reload), THE VERSION SKEW (2.3 s, the reload), a core sheet
failed (1.4 s, no reload), `/api/sky` + `/api/time` dead (1.4 s), the fonts never answering (5.0 s), a city module never answering (13.8 s, the
reload + the BOOT HANG report sent) — **load 28 / 28** (~106 s; harbor-jobs.mjs's SECONDS updated).

**The reveal (Chromium, no throttle, 3 loads — LOAD FIX 2's run):** 1.33 s before → **1.33 s** now (the boot screen's first paint 32 → 36 ms —
the inline script). No speed traded. **No look change**: pixdiff (`--pin`, the title preview, before = 4c945a65 on :5175) night 1 px, noon
0 px, golden 27 px (walkers in the promenade band — the usual residue).

## Group 3 — THE MUSIC ON THE TAP

**The gap** (LOAD FIX 2's known issue — the music ½–1 s after the first tap): everything happened AFTER the tap — the station's synced player
was made only at the next 250-ms music tick, then the WHOLE song was fetched (2–3 MB), then decoded, then the voice was placed on the server
clock. **The fix** (no audio before a gesture — a decode is not a sound; the song still on the server clock):
- `audio/party-music.js#warmAhead`: once the city has been on screen 1.5 s (app.js — `cityShown`, the page visible, no room), the song the
  station will be playing at a tap (the next one when this one ends within 25 s) is FETCHED + DECODED on an OFFLINE context
  (`synced-songs.js#warmSong` — the shared decode cache, a ref of its own); ≤ 3 songs a page (a phone left on the title without a tap stops
  fetching); never with Save-Data; never with the music off (no station → no warm). Released 20 s after the tap (the player holds its own).
- `synced-songs.js`: a song already decoded is handed to the player IN the tick that asks for it (the buffer kept on the cache entry) — not a
  promise's turn later.
- `app.js`: the music tick runs IN the tap (`onUnlock`) and again the moment the graph runs (`onResume` — the synced player starts a voice only
  on a running clock: the place on the server clock stays exact).

**Measured** (`tests/integration/tap-music.mjs` — the real boot, the city revealed, 3 s, ONE tap on the sky; "the music" = the station's synced
player sounding (`partyMusicDebug().heard` — its voice past its start, its gain past 0.05) or this phone's own player; Chromium on THE LINE's
Wi-Fi-like 40 ms / 40 Mbps, mid-song; the PC busy with the WebKit batteries for the BEFORE runs):

| | before (4c945a65) | after |
| --- | ---: | ---: |
| night (the party station), 3 taps | 1.69 / 1.97 / 2.43 s | **0.09 / 0.10 / 0.17 s** |
| day (the morning station), 3 taps | 1.85 / 1.88 / 1.90 s | **0.14 / 0.14 / 0.16 s** |
| a song voice before the tap | none | none |
| the voice's place vs the station's (server clock) | — | 158.54 vs 158.62 s (the ramp's first quantum) |

**WebKit can't be measured here**: Playwright's Windows WebKit has no Web Audio at all (`AudioContext` undefined) — the owner's iPhone check
(step 2) is the Safari proof. The harbor `stations` + `partysync` + `music` + `tape` groups: **144 / 144**. The iPhone's silent switch + the
music-off setting: the audio session code untouched; with the music off there is no station, so nothing is fetched or decoded.

## Group 4 — THE APOSTROPHE TUBE

- `core/marks.js#LETTERS["'"]` = `M2.7 0 L1.5 4.4` — a short tube high on the line (0–4.4 of 14), slanted like a typed ’, the letters' own stroke,
  in a NARROW cell: `GLYPH_ADVANCE` (0.36 of a letter — `glyphAdvance(ch)`), so H-O-L-D-'-E-M keeps its rhythm. `tubeText(s)` = a name as the
  alphabet spells it (upper case, the typed ’ → ', anything without a glyph dropped, spaces kept) — the ONE strip rule now.
- Every ROW of tube letters steps by the glyph's own advance: THE GAME START's sign (`ui/tube-logo.js#gameLogoSvg` + `logoLines` — was
  `[^A-Z ]`, the apostrophe stripped: HOLDEM), the city's sign rows (`harbor/signs.js#lettersRow`, `signName` — was `[^A-Z ]`), the cards' sign
  rows (`fx/sign-kit.js`), `bladeWord`'s fallback (was `[^A-Z]`); HOLD'EM's mark: `blade: "HOLD'EM"`.
- **The signs that can't fit it — they drop it on purpose:** a VERTICAL BLADE (stacked letters — `harbor/signs.js#lettersCol`,
  `fx/sign-kit.js#bladeLayout`): an apostrophe can't stand in a column. (No current city sign has one: the five signs are PRISM DROP, OVERCLOCK,
  NEON PAR, HIGH STAKES, GRIDLOCK. Not game names, so untouched: the SPEAKEASY word (`ui/word-neon.js`, its own alphabet), the waterfront's shop
  words, the hush word, OVERCLOCK's winner sign (players' names — its own `EXTRA` digits).)
- `tests/apostrophe-tube.test.mjs`: every character of every GAMES + DAILIES name, every meta's BANNER_NAME, every blade word has a glyph — or
  is on the DROPPED list (a space); the apostrophe's shape (high, slanted, inside its narrow cell); HOLD'EM's sign = seven tube letters.
- **The look** — the REAL game-start sign (the real title, the real `.rc-tonight` markup + title.css, `gameLogoSvg(holdem, { lit, premium,
  tint: NEON_PINK })` as room-city.js mounts it; `shots.mjs --preview --js …`) at 390 / 402 / 430, unzoomed: **HOLD'EM** — the apostrophe
  reads as one (`load-fix-3/holdem-sign-390x844.png`, `-402x874`, `-430x932`).

## Group 5 — NO BLACK TILES

- **Found** (a measure of every card: its material ALONE — no effect running — vs its effect's own still frame, mean brightness + lit share):
  24 cards whose material is a near-black ground (lit ≈ 1 %) and whose whole picture is the effect — the known PENTHOUSE · THE DIAL, + INFERNO,
  PRISM, NOIR, LEGEND, MARQUEE GOLD, NEON CAMO (its camo is the effect's image), WILDFIRE, ETERNAL, WITNESS, FOUNDER, HOUSE, DEV SOURCE, THE 8
  SIGHTING CARDS (UFO, TR-3B, BLACKBIRD, F-22, GHOST SHIP, AURORA, FIREBALL, SKULL) and PRISM DROP's three STRIPS (PD-5B baked their full cards
  only). Not code-drawn: the gift cards, OVERCLOCK / THE PASSWORD / COAST CLEAR / PERFECT WEEK (Grok's art = the material), the CSS-designed
  materials (CSS_ART — brushed, chrome, marble, carbon …), the emblems (SVG layers in the DOM — no renderer).
- **The fix = PD-5B's, for all of them**: `scripts/build-card-stills.mjs` (generalises `build-pd-cards.mjs`) bakes each card's effect STILL
  (the reduced-motion frame, its tint) as the strip (360 × 64 @2) + the full card (400 × 252 @2) → `assets/vault/still/<card>-s.webp` /
  `-f.webp` (45 files, ~0.75 MB — each loads only where its card shows unpainted) + the GENERATED block at the end of css/vault.css.
  `js/vault/stills.js` = the list (STILLS) + the CSS-designed ones (CSS_ART).
- **Never under a live effect**: most effects draw transparent light over the material — a still beneath would double the picture. So
  `fx/renderer.js` marks a slot it has PAINTED (`.fx-on` on the card's element; off again when the slot is removed, its effect fails, the surface
  is destroyed or cleared) and the still is the material only `:not(.fx-on)` — where the effect runs, the card is exactly as before.
- **The art unchanged** → no `LAB_V` bump, no CHANGED line.
- `tests/card-stills.test.mjs`: every LOOKS card has a picture in its material, a still, or a place on CSS_ART (a new code-drawn card fails);
  every still on disk + wired; the block current (`build-card-stills.mjs --check`); the renderer's `.fx-on` marking.
- **The look at 402** (THE LAB's grid — `vault-preview.html`, the strips cropped; `load-fix-3/no-black-tiles-402.png`): BEFORE with no effect
  running = near-black strips; AFTER with no effect running = the still (PENTHOUSE's dial + PH, the Blackbird, FOUNDER's NEON sign, FIRST KO);
  AFTER with the effect running (the 2D path — headless screenshots don't capture the GPU canvas; the renderer's own probe counts its lit
  pixels there) = the same frame, moving. The profile's collection + THE BOARD wear the same strip element + the same rule (not shot apart).
  The harbor `vault` group **58 / 58**; the unit suite 1579 / 1579.

## Group 6 — the end

- **Docs:** this log; docs/harbor.md (#performance THE BOOT SAFETY NET, KNOWN ISSUES, the index — no file moved); decisions.md; docs/audio.md
  (THE MUSIC ON THE TAP); docs/vault.md (NO BLACK TILES); docs/testing.md (wk-freeze, THE LINE, tap-music, the card stills); ROADMAP + history;
  plan.md's build table; CLAUDE.md (THE BOOT WATCHDOG under THE LOAD; code-drawn cards = a baked still).
- **THE BUSY-PC CHECK:** before the full suite only the emulators, my `serve.mjs` (:5173) and Ben's :5190 preview server (his — left running);
  17.9 GB free. My A/B servers (:5174 LOAD FIX 2's parent, :5175 the pass's base, :5177 DAILY_TEST) + their worktrees were stopped / removed
  first. (A `serve.mjs --emu` left on :5173 from an earlier pass, started 11:54 am, was stopped at the start.)
- **Locally (the mini PC):** the unit suite **1579 / 1579** · rules **76 / 76** (unchanged — nothing to re-publish from this pass) · `/api`
  **44 / 44** · smoke **6 / 6** · CONN green · THE BASELINE GUARD **3 / 3** · `e2e-daily` **51 / 51** (on its DAILY_TEST server) ·
  `e2e-prism FAST=1` **63 / 63** · `e2e-holdem FAST=1` **12 / 12** · the FULL `e2e-harbor` at 4 shards **1228 / 1232** — the four reds
  (`sightings` — the capture's worst frame 133 ms; `sgfast` — a fast legendary's photo; `motion` — the dancers' arms; `roomperf` — the room's
  cost at 4×) **all green alone: 21 / 21** (the shards' load, as in LOAD FIX 2's run).
- **The rules: NOT changed** (PFIX-B's change of Nov 10 still waits for the owner's re-publish). Still 8 functions.
- **Not started:** anything outside the four items.

**Known issues** (also docs/harbor.md KNOWN ISSUES): a request that never answers costs 12 s + a reload (a stall can't be told from a slow
phone sooner); a second hang in one tab without a reveal between gets TAP TO TRY AGAIN, not another reload; THE MUSIC ON THE TAP measured in
Chromium only (Playwright's Windows WebKit has no Web Audio — the iPhone judges Safari); the warm-up decodes up to 3 station songs a page even
with no tap; how often a real iPhone loses a request can't be measured here — the BOOT HANG reports in /admin will say.
- **Cloud run 1** (2827a170, the harbor tag): **tests ✅ + harbor ✅ (all 15 jobs) — green first try.** Vercel BUILT 2827a170 (live).
- **The servers:** every server this pass started is stopped (the emulators, serve.mjs :5173, the A/B servers :5174 / :5175, the daily test
  server :5177) + the A/B worktrees removed; Ben's :5190 preview server left running.
