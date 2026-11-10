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
