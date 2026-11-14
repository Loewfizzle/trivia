# Testing

Every test suite in detail: unit + simulation, emulators, the smoke test, each game's E2E and its flags, previews, Lighthouse.

**WINDOWS (Nov 1) — THE TRIMMED SUITES.** Only the playable games run — PRISM DROP + OVERCLOCK, + HOLD'EM since HE10 (Nov 11): the smoke test starts those three (+ checks that
none of the ten hidden games can start — host.js#startGame refuses them) — ≈ 30 s locally (was ≈ 2 min); `e2e-presence` + `e2e-conn` (the cloud's
tests job) play OVERCLOCK (were LAST SIGNAL / CIPHER); the ten hidden games' long E2Es (`e2e-cipher`… `e2e-rum`) don't run until a game
comes back; their quick unit tests stay in `node --test tests/*.test.mjs`. **CITY 1.0 OUT (Nov 5): City 1.0 is DELETED** — its
suites went with it (`e2e-title`, `e2e-sky`, `e2e-street`, `e2e-rainbow`, `e2e-people`, `e2e-party`, `e2e-chat` (the old lobby's chat strip), `lobby-shot`,
`ui-shots` (the old lobby's menus), `brand.html` + `render-assets.mjs` (the icons + og.png from City 1.0's scene — the images stay in `assets/`));
`e2e-stage2` + `e2e-8p` were DELETED in OC5 (Nov 6 — they tapped the pre-OC3 / pre-OC4 screens; `e2e-oc-2` + `e2e-oc-new` play OVERCLOCK on 8 phones, git history keeps the old files). The Harbor suite's `core` group checks an old `?city=1` link lands on the Harbor; `citydown`
(the `city` job) blocks the Harbor's module: THE CITY COULDN'T LOAD + RELOAD after the one retry; `stuckjoin` (the `lobbyfix` job) — THE STUCK
JOIN: a guest / the host / the last one leaves, a reload in the room, a reload after → JOIN is fresh + a typed word gets in (402 + 1440;
`wk-room.mjs` checks it in WebKit). **pixdiff** gained `room` / `room-day` (title-preview's `&act=room`: four players at the door over the real
city) and `card` / `you` (`page:<path>|js:<expr>` shoots any page — the full card over CUSTOMIZE, the YOU page); `--b http://localhost:5174`
(A against A) shows what moves on its own (the window scenes, the walkers, a flickering pumpkin) — the noise a real diff must beat.
The window scenes: `ONLY=windows,quietbuilding` (the shades after hours + the lights-out one at a time; the old quiet building behind
`&force=old-windows`) + the unit tests `harbor-scenes`, `harbor-juggler`, `harbor-window-scenes`.

## Testing
- **THE VAULT 1A** (docs/vault.md): `node --test tests/vault.test.mjs` (pure) · `node --test lab.test.mjs` (in `tests/integration`, the
  emulators: THE CARD LAB's marks — owner only, audited, the export; in the cloud's tests job) · the harbor `vault` group (the `audio` job:
  the lab's 10 items on ONE canvas, the marks, 8 legendaries at 4× CPU = 60 fps on the real compositor, on-screen only, reduced motion) ·
  THE VAULT 2C: `tests/vault-2c.test.mjs` (unit) + `tests/integration/vault-2c.test.mjs` (/api — the 12 sign-up shapes granted + back-filled + worn,
  a mark's version); the harbor `vault` group adds THE LAB 2.0 (`vault-preview.html?marks=old|done&filter=&face=full&fd=1`), the badge slots at
  390 / 402 / 430, ONE EMBLEM SYSTEM by finger, the profile's order, THE WRONG DOOR (made-up paths at 390 / 402 / 430 / 1440); the bench's `nogem`.
  THE VAULT 2B: `tests/vault-2b.test.mjs` (unit) + `tests/integration/vault-2b.test.mjs` (/api on the emulators — member numbers, the dev cards,
  the seasonal grant); the lab preview's `&sheet=1` (EMBLEMS / GLOWS tabs: a contact sheet), `&wear=emb2,glow` (the busiest 2B mix), the
  profile preview's `&dress=1&tab=emblem` + `&dev=1`; `shots.mjs --page … --el <selector>` scrolls an element into view + crops to it (a slot
  on the shared effect surface draws only ON SCREEN — a full-page crop below the fold shows it blank).
  `tests/integration/vault-preview.html` (the lab without Firebase; `&view=full`, `&full=<card>`, `&diag=…`, `&fx=2d`) · THE VAULT BENCH `node tests/integration/vault-bench.mjs "<chrome>"` (A FULL LOBBY at a CPU slowdown, each cost off in turn — VAULT 1B; 2A: `WEAR=emb,glow` puts the samples' emblems + glows on the strips, `WEAR=<emblem id>` one on all 8) · the lab's `&view=emblems|glows` · shots.mjs `--page … --wk` (THE VAULT 2A: the page in WebKit as an iPhone, @3) · `tests/integration/program-preview.html` (THE PROGRAM's real paint, `?at=&filter=`) · shots.mjs `--page <url> --crop XxYxWxH --every ms --count n` (a
  close-up burst — judge a strip MOVING) + `--scrolls N` (a page that scrolls inside its own box) + `--js`.
- **GitHub checks** (`.github/workflows/tests.yml`, Oct 2026): **since SP6 (the owner's CLOUD MINUTES, Oct 27 — Pro's 3,000 a month went at
  ~400–600 a day when this ran on every push) only a pass's FINAL push runs it**: a push with **`[ci]`** (a game / app pass) or **`[harbor]`** (a City 2.0
  pass) in one of its commit messages — whatever the push touched, docs-only included (FR6 FIXES A, G5: no path filter on push any more); pull requests and `gh workflow run tests` always run; any other push shows a skipped run (0 minutes; it never
  cancels a full run in flight — a newer full run cancels an older one). The build machine (THE MINI PC, below) runs `node --test tests/*.test.mjs` before every push. Budget
  ≈ 95–105 billed cloud minutes a pass (THE SPEED PASS — FR6 G8's real count: this workflow ≈ 8–10, the harbor's 15 jobs ≈ 85–95 billed; a re-run costs one job). It runs the unit tests,
  then the rules tests, the `/api` tests and the smoke test on the emulators with headless Chrome. They run **next to** the Vercel
  deploy, never in front of it; a failure is a red ✗ on the commit (and an email). (Since Oct 27 Vercel itself deploys only a push whose LAST
  commit carries `[harbor]`, `[ci]` or `[deploy]` — `vercel.json#ignoreCommand`, CLAUDE.md → Testing.) The smoke
  test's screenshots are attached to a failed run. Nothing there needs a secret. `gh run list` / `gh run watch` from the terminal.
- **THE MINI PC — THE BUILD MACHINE** (THE MODELS PASS, Oct 30; the laptop retired): Beelink SER8, Windows 11, 32 GB, Node 26, Python 3.12
  (+ `~/.cache/neural-arcade/pyenv`), Java (Temurin 21) — the emulators run locally. **Before every final push, locally:** `node --test tests/*.test.mjs`
  (≈ 75 s) → `node --test rules.test.mjs` (≈ 27 s) + `node --test server.test.mjs` (in `tests/integration`, on the emulators) → the smoke test
  (`GAMES=…` after touching a shared file; `GAMES=cipher` ≈ 38 s) — and EVERY `tests/integration/*.test.mjs` (FR6 FIXES A: the cloud's tests job runs
  sightings / progression / lab / vault-2b / vault-2c too; a pass that ran only rules + server.test met a red cloud) → for a City 2.0 pass THE FULL `e2e-harbor` suite (time + peak memory: the pass log,
  docs/harbor/passes/models.md) — so the cloud run confirms, never discovers. Start the emulators (`npm run emulators` in `tests/integration`) and
  `node scripts/serve.mjs --emu` in the background first. **Restart it after touching `api/`** (FR6 FIXES A: `serve.mjs` caches each `/api` module on its first call — a server started
  before an `api/` change serves the OLD code to every E2E; the static files are re-read each load, so only the /api checks go stale). **Nothing else heavy beside the full suite** (a SwiftShader model bake + shot bursts next to
  it made every group time out on "the harbor baked" — MODELS). **The sandbox:** browser tests run outside Claude Code's sandbox (its private AppData
  copy can't launch Chromium) — the uncommitted `.claude/settings.local.json` excludes `node tests/integration/e2e-*`, `shots.mjs`, `title-perf.mjs`,
  `pixdiff.mjs`… from it (run them from the repo root with those paths). Chromium: `C:\Users\benja\AppData\Local\ms-playwright\chromium-1248\chrome-win64\chrome.exe`. winget's msstore source fails a cert check — install
  from the winget source.
- **THE TEST BROWSER — SILENT + 60 FPS** (ATM-A, Oct 31): every browser script imports puppeteer from `tests/integration/kit/puppeteer.mjs`, never
  `puppeteer-core` (`tests/test-browser.test.mjs` greps for strays). Its `launch()` adds the flags every run needs: **`--mute-audio`** (the owner: the
  city's sounds came out of the mini PC's TV + soundbar during a pass — Web Audio still runs, the audio checks read the page's own state / analysers) and,
  on Windows, **`--disable-gpu-compositing`** — **THE 30 FPS FIX**: the mini PC drives its TV at **4K / 29 Hz** (`Get-CimInstance Win32_VideoController` →
  CurrentRefreshRate 29), and Chromium on Windows takes its frame clock from the primary display's vsync EVEN HEADLESS (a plain rAF counter: 33.4-ms
  frames, ~28.5 fps — with or without `--enable-gpu`, SwiftShader, the new / old headless, the no-throttle flags). Software compositing runs on Chromium's
  own 60 Hz clock (16.7-ms frames) while WebGL stays on the Radeon 780M; `--disable-frame-rate-limit` only reached ~52 fps unpaced. Proof: the rAF
  counter 60.0 fps, `ONLY=perf`'s calm load + the battery's 60-fps moment PASS locally (they failed on every build before). Skipped when a run asks for
  the GPU on purpose (`--enable-gpu`, `GPU=1`) or `VSYNC=display`; Linux (the cloud) is untouched. (Setting the TV to 60 Hz would also fix it — the
  owner's call, not the tests'.)
- **THE GPU PIN** (SHELL 2.0 B1 Group 0 — SHELL 2.0 A's local run had NO WebGL2: the fireworks + every speed check red, 18 in all). NOT the driver
  (the Radeon 780M's 32.0.12019.1028 from Oct 2024, unchanged; the Nov 5 updates were Defender signatures): the mini PC RESTARTED with NO DISPLAY
  attached (the TV off — every monitor `Present: False`), so Windows lists the **Microsoft Basic Render Driver** first and ACTIVE; Chromium's GPU
  process crashed on it until it gave up ("GPU access is disabled due to frequent crashes" in chrome://gpu → WebGL disabled outright). The Radeon
  is still there as the second adapter, so `kit/puppeteer.mjs` asks chrome://gpu ONCE PER BOOT for the first non-Microsoft adapter's LUID (cached in
  the temp folder as `neon-gpu-<boot>.json` — a LUID changes every boot; `pickAdapter`, unit-tested) and adds **`--use-adapter-luid=<hi,lo>`** —
  nothing when a real GPU is already active (the TV on). With the pin and the GPU compositor in use (the real-compositor calm load, `GPU=1`) it also
  adds **`--disable-direct-composition`**: without a display, DirectComposition presents through DWM at ~20 Hz (51-ms frames on 8 ms of work);
  the plain swap chain runs 15.6-ms frames. `GPU_LUID=off` skips the pin, `GPU_LUID=<hi,lo>` sets it. **Check it: `node tests/integration/gpu-check.mjs
  "<browser>"`** (WebGL / WebGL2 + the renderer string + chrome://gpu's feature table; exit 1 on no WebGL2 or a software renderer) — run it first
  whenever the speed checks go red together. Proof: `ONLY=perf` 12/12 with the TV off (the calm load tier 2 held, the guard 0.45–0.56×). A dummy
  HDMI plug (a 4K headless display emulator) would make the machine look like it has a display — no longer needed for the tests.
- **THE DISPLAY CHECK** (SHELL 2.0 B2 — the owner, Nov 5 12:58 pm: NO dummy plug). The two VAULT lobbies measured on the REAL compositor (the
  frames a screen would show — `launchReal`) are slow with no display attached whatever the page does (DWM presents display-less). They ask
  `kit/puppeteer.mjs#displayAttached()` first (Windows' present monitors: `Get-PnpDevice -Class Monitor -PresentOnly`; `DISPLAY_ATTACHED=1|0`
  overrides): attached → they run exactly as before; none → their rule half is checked and the speed half is **SKIPPED with the reason "no display
  attached (a no-screen boot)"** (`harbor-e2e/kit.mjs#skipNoDisplay`) — never a fail, never a silent pass. The suite's last line counts them apart:
  `checks N/M passed (of them X ran + passed · K skipped (no display) · J skipped (on CI))`. Pure verdict `displayVerdict` (tests/shell-b2.test.mjs).
- **A FLICKER, MEASURED** (SHELL 2.0 B2): `shots.mjs --cast <ms>` saves every painted frame; `tests/integration/cast-flicker.mjs "<browser>" <dir>`
  cuts each frame's sky into a 12 × 4 grid and reports the frame-to-frame jumps + the FLICKERS (a cell that jumps and comes straight back).
- **THE LINK-PREVIEW IMAGE**: `node tests/integration/shots.mjs "<browser>" --preview --city 2 --scenes og=2026-06-12T22:30 --sizes og --idle` →
  copy to `assets/og.jpg` (1200 × 630, JPEG ≤ 300 KB — og.png is gone) + bump its `?v=` in index.html. /board's: `node scripts/seed-og-board.mjs` (made-up rows on the emulators) → `node tests/integration/og-board-shot.mjs "<browser>"` → `assets/og-board.jpg` + its `?v=` in board.html (FR7 FIXES B).
- **THE 20-CYCLE MEMORY CHECK reads the heap WITHOUT V8's compiled code** (ATM-A — `harbor-e2e/kit.mjs#heapNoCode`): heap snapshots at cycle 2 vs 20
  showed +6.2 MB of JIT code (1,098 InstructionStreams — it grows with how long + how fast the page ran: +4.3 MB here, +6.4 in the cloud on the same
  build) against +0.35 MB of JS objects; the check takes a snapshot (a full GC first) and counts every node but `code` — objects, strings, closures,
  the DOM, Blink's objects — under the same 6 MB limit; the message prints the compiled code apart.
- **THE HARBOR IN THE CLOUD** (`.github/workflows/harbor.yml`, Oct 24): the WHOLE
  `e2e-harbor.mjs` (`SHOTS=0`, on the emulators) on GitHub's machines. **The rule (PART 8P, the owner's 2,000 monthly minutes — the repo is
  PRIVATE): it runs only on a pass's FINAL push** — a push with **`[harbor]`** in one of its commit messages (`CITY 2.0 PART 8P: … [harbor]`)
  — **whatever it touched (FR6 FIXES A, G5: the old `paths:` filter judged the WHOLE push's diff and created NO run when nothing matched,
  before the tag was read — LOBBY 2.0 B's tagged final push was one docs commit and never ran; `tests.yml`'s `paths-ignore` had the same hole.
  Now neither workflow filters a push by path: the tag on the TOP commit (as Vercel reads it) or on any commit of the push decides;
  `tests/workflows.test.mjs` evaluates both files' own `if:` expressions against simulated pushes)** — or by hand: `gh workflow run harbor` (Actions → harbor → Run workflow), `gh workflow run
  harbor -f job=street` for one job. A mid-pass push without the tag shows a SKIPPED harbor run (0 minutes) and never cancels a full run in
  flight; a newer full run cancels an older one. The quick `tests` workflow (unit, rules, `/api`, smoke) runs on the same `[harbor]` push (and on `[ci]`).
  - **4 parallel jobs** (the matrix `audio` · `show` · `city` · `street`; each job's groups in **`tests/integration/harbor-jobs.mjs`**,
    run in order in one process with `JOB=<name>` — the same command works locally): audio = music, flags, harbor, dock · show = neon,
    party, sky, life (FP3b: real doors + the dance circle) · city = core, skyline, water, load (FP3a: THE LOAD GATE — the reveal through two bar changes), then panel + perf (the
    two serial groups, last) · street = speakeasy, windows, sounds, people, motion (PEO: the people's motion — a 12-s rig trace of the afternoon + the dance circle); promenade sits in `city`. Each job has its own emulators + its own npm / emulator caches; a failed job attaches `harbor-results-<job>`. **A red job →
    "Re-run failed jobs"** re-runs that job alone (≈ 4 min), never the whole suite.
  - **THE FILES** (NIGHT-B Group 0): `e2e-harbor.mjs` is the entry point + the runner (the same CLI + env); the shared harness (`ok` /
    `okT` / `okF` / `skipCI`, `open`, `waitFor`, `tap`, `harborUp`, `G()` + `GROUPS`…) is `harbor-e2e/kit.mjs`; each cloud job's groups
    live in `harbor-e2e/<job>.mjs` (a helper only one job uses stays in its file; one a second job needs moves to the kit).
  - **THE STREET PARTY** (NIGHT-B): `ONLY=streetparty` (the `city` job, ~60 s — Sat Oct 24's conga break joined ~55 s in, `&force=dance&dance=bounce`,
    a Thursday without, THE STAGE LIGHT's falloff, the crowd's sounds); unit `tests/harbor-streetparty.test.mjs` + `harbor-tables.test.mjs` +
    `harbor-solids.test.mjs`; title-perf's `sp-peak` / `sp-break` / `sp-break-stage` scenes; the phone bench's `party-break` scene.
  - **NIGHT-C**: `ONLY=partysync` (the `perf` job, ~55 s — two phones on Saturday's party night each within ~100 ms of the server clock's
    timeline, the conga break starting on the song the phone hears, three live phones (the panel's PARTY) + a late joiner within ~50 ms;
    unit `tests/party-deck.test.mjs`) · `ONLY=heli` (`perf`, ~57 s — the night + the day patrol, up over the crowd as the conga starts, its
    pool on the dancers swept on the beat, off past the edge after the song; unit `tests/harbor-heli.test.mjs`) · `ONLY=roofcrisp` (`audio`,
    ~28 s — the roof signs at 3.00× on a 3× phone, their luma within ~12 % of the city's own, rain → the city's copy) · `ONLY=quietbuilding`
    (`show`, ~20 s — the parked rooms + their mix, no moment in them, out one by one by 1:40, a party night / the day unchanged, Monday's
    upper middle parked, the live windows at 3×; unit `tests/harbor-quiet.test.mjs`) · e2e `people`'s A REAL ZEBRA (five bars, each gap
    about a bar deep). The music group's direct-path checks run with `&force=no-party-sync` (they drive this phone's own player); title-perf
    `nc-night` (the quiet building + both crisp layers at 3×) + `nc-break` (a forced break with the helicopter).
  - **SKY-A**: `ONLY=heli` adds the break flight's checks (never in front of a sign, low over the water, drifting, the canvases hold, the patrol's
    two loops) · `ONLY=partysync` (no own-player start on a synced night) · `ONLY=legends` (the new `legend` cloud job: the F-22 chase on the
    model — a vic + the bank; the TR-3B's full-res overlay at 3× + its lights on the world + TOOLS → TR-3B SOFT; a normal night never fetches
    the jet) · `ONLY=blackbird` (`legend`, ~50 s — the tell, above the sign under the buttons, the cone + ring, the overlay gone after, the
    chase across the dark sign, the watcher's reward, a solo sighting at its time); unit `tests/harbor-blackbird.test.mjs` (+ the legends'
    registry) + `harbor-heli.test.mjs`; title-perf `sa-break-noheli` (`--vs sp-break`: the helicopter's own cost) + `sa-patrol`; the phone
    bench's `blackbird` scene (+ `party-break` / `tr3b` now carry the helicopter / the chase's Blackbird). `shots.mjs --crop heli`.
  - **THE MODELS PASS**: `ONLY=mothman` (the new `models` cloud job, ~30 s — perched from a link within ~5 s of the reveal on the needle's tip, his own overlay at the phone's dpr, two red eyes, the leaving: the needle's dark stutter + the glide, the overlay gone; an ordinary night never fetches his sprites; unit `tests/harbor-mothman.test.mjs`) · `ONLY=boxer` (`models`, ~80 s — + THE BAG STAYS IN ONE SPOT, facing away from it in the air + toward it at the bag, it swings, the rest's SIT) · `ONLY=speaker` (`models`, ~10 s — two pages on one station + SPEAKER DELAY 150 ms → that page ~150 ms earlier) · `ONLY=heli` (its 4th page: the baked model, the near pass ≥ 55 pt, the turn toward us on a stop, no stop behind the speakeasy, the searchlight's steps < 0.25 rad) · `ONLY=panel` (+ a forcing link keeps its own `&force` while EVERYONE is on) · `ONLY=freeze` (a link's legendary `link.lead` 2.5 s after the tap); title-perf `mm-perch`; the phone bench's `mothman` + `patrol` scenes.
  - **A NEW GROUP** (`G('people', …)` in its job's file, `harbor-e2e/<job>.mjs`) goes in exactly ONE job in `harbor-jobs.mjs` (the lightest by its `SECONDS` table) — until it does,
    `e2e-harbor.mjs` refuses to run (even with `ONLY=`) and `tests/harbor-jobs.test.mjs` fails in the quick workflow, so no group is ever
    skipped silently. A new JOB: a key in `CI_JOBS` + the same name in harbor.yml's matrix list + the Run-workflow options (the test checks).
    A local no-ONLY run (`SHARDS=2|3|4|5`, the default 4 since PERF-A: ~21 min on the mini PC, nothing timed out) spreads the same groups over its shards by `SECONDS` (`localShards` — the cloud's REAL per-group seconds since PERF-A; a new group: its first cloud run's seconds), then panel + perf (perf in its own child with the GPU locally — GPU=1: the TV is 60 Hz; CI / an explicit GPU or VSYNC keeps the old way).
    THE UNIT SUITE's wall time is its slowest FILE: harbor-people.test.mjs was split into six (PERF-A — 83 → 30 s); keep a new test file under ~15 s.
    pixdiff.mjs works again (PERF-A: puppeteer's Uint8Array screenshots) + scenes christmas / fog / fog-party / mist.
    SCHED: `--pin` freezes the page's Date.now at its load (the clock-driven signs hold: an A-A noise floor ~0.03 % at night — the
    no-look-change proof for a refactor) + scenes rain / snow. THE GOLDEN TABLE: `node scripts/sched-golden.mjs` (compare; `--raw <system>`;
    `--write` only before a move or when a pass changes the schedule on purpose — say so) + tests/harbor-sched-golden.test.mjs. THE SCHEDULE
    SIM: `node scripts/sim-sched.mjs` (a year of the showcase per dial level; tests/harbor-showcase.test.mjs).
    **PERF-B — THE OVERHEAD**: the `windows` group's 28 blocks run 3 pages at a time (`WIN_POOL=3`; `WIN_POOL=1` = the old serial order) — the 8
    that time FRAMES (the toast's 60 fps + arm steps, the walk-in, the tango, the TV's flicker, the boss late, the cash, PLAY ALL) run alone after the
    pool; a failing block logs `FATAL [windows:<slot>]` and the rest still run. Locally 280 s (the cloud's 446 s was the suite's critical path).
    No fixed waits for conditions: `harborUp(p); await settled(p)` in the windows file (wild + holiday keep their 1.5-s pause: it also covers the lazy holiday dressing + the weather's blend, which `settled()` doesn't — the cloud proved it, PERF-B), the legends' UFO trace waits for its condition (the
    UFO gone + ≥ 3 walkers back, ≤ 52 s), the music group's stuck checks wait for `health.stuck`. The cloud: the perf group's frame-pacing loop
    (warnings only) skipped on CI (`ON_CI` — it runs on the mini PC), the smoke's watch 8 s a game (`WATCH_MS`), `npm ci --no-audit --no-fund`.
  - **WARNINGS, not red** (on `CI=true`, or locally `TIMING=warn`; `TIMING=strict` makes them hard again): `okT` — pure speed (frames
    drawn in a window, a bake finished in time, a sound's peak in its window, the punch after a return, the pole's turn rate, the scene
    reading PULSE STRENGTH's flag within 3 s, the frames drawn after a return); `okF` — **known-flaky pixel probes** that failed once in the
    cloud and passed the next run with the code unchanged: THE WALL-WASHERS' hot spot, the water's seam-light limit, the O's flutter landing. The half of each that proves the rule
    stays hard (no plain red on the pole, the water strips on whole rows, every letter keeping its core, the loop restarting after a
    return, the slider + flag + status). Each warning is a `::warning::` annotation on the run and a row (kind + check) in the job's
    summary page; the log says `WARN … (a timing|flaky check: a warning on this machine)` and `checks N/M passed · warnings K`. A red
    cloud run always means a real problem; a warning that repeats in two passes is worth a look.
  - **Minutes:** the old single job was 10–14 min a run (≈ 100 billed min on Oct 24 alone, 9 runs). Now ≈ 4 parallel jobs × ~4 min
    (≈ 3 min of tests + ~1 min of setup each; billing rounds EACH job up to a whole minute) ≈ 16–20 billed min for a full run — but only
    on the final push, ~4–5 min of wall time, and a re-run costs one job. (The quick `tests` workflow is ≈ 8 billed min a push: unit 1 +
    integration 5–6, each rounded up.)
  - After pushing: `gh run list --workflow harbor` → `gh run view <id>` (the jobs) → `gh run view <id> --log-failed`, or the summary page.
    GitHub's 2-core machine is slower than the mini PC: a timing check that passes here and fails there waits for its condition (never a
    longer fixed sleep).
- **What a phone loads + errors from phones:** `node e2e-loading.mjs "<browser>" ./shots-loading` (≈ 1 min): the title links no
  game stylesheet; a game's sheets load with its screen, in the old cascade order; the lobby warms them; an error thrown in our code
  reaches `errlog/` once, noise doesn't, two phones share one entry.
- **The title city's looks** (LIVE WEATHER, birds, the street — docs/title.md): `?when=…&tz=…` + `&wx=clear|clouds|overcast|fog|drizzle|rain|storm|snow|sleet|freeze` + `&force=lightning,geese,swifts,pigeons,heron,train,steam,rush,eclipse`; previews never use the live weather. `&force=no-clouds,no-road,no-birds,no-rain` switches parts off for performance checks. `e2e-title.mjs` runs at a fixed autumn night (the sign checks) and measures frame pacing at a fixed afternoon: at night the top tier is heavier and a 4×-slowed CPU steps down a tier there, as designed (measured the same before and after LIVE WEATHER). Anything under the dock's glass (backdrop blur) must not render when unused — an invisible animated layer there cost 80 ms frames.
- **CITY 2.0 — THE HARBOR** (`docs/harbor.md`, `?city=2`): `node --test tests/harbor.test.mjs` (the camera + layout at six sizes, the
  lane rects, the stateful scheduler: no pop-ins, anchors, density; Part 2: the corridors vs the whole silhouette, the dense base, one
  skyline on every phone, the wheel, the word faces, the light timeline, the font; Part 3: the word faces uncovered, every game's sign + its spot clear, tonight's pick, the outlines' palette + faces, the tubes, the scroll; Part 4: the outlines' Deco contours + fins, the icons ≥ 19 pt + the clear centre + the construction tower's spot, the water's band at every size; Part 5: the roof signs on the word towers (under the limit, out of the corridors), the wheel's feet on the pier platform, the boats on the clock — never through the pier, the taxi across the whole width, day / night per cycle, the far boats phased against docked Rosie; NEON PASS 3: the palette (≤ 3 colours a building, almost every building lit, neighbours contrast, warm near / cool far), DEPTH (4 steps), the blade's letters ≥ 10 pt, THE PARTY SHOW (scenes, steady buildings, never strobe-like, tiers, drops), the everyday motion, the night's colour stages, the burnt-out letter; THE PREVIEW PANEL: the registry ↔ every `force.has(…)` in the code, validation, the flags, the sun's times, holidays); `node e2e-harbor.mjs "<browser>" ./shots-harbor` — **GROUPS (NEON PASS 5):** `ONLY=core,flags,skyline,neon,water,harbor,sky,party,panel,dock,perf` (comma-separated) runs those in one process (while working: only the groups the task touches, ~30–70 s each); with no ONLY the independent groups run in **3 parallel shards** (`SHARDS=1|2|3`, child processes, each its own browser — the same checks), then `panel` (it writes the shared `city2/live` node) and `perf` (CPU-throttled) alone; the full suite once before a commit (223 s → ~190–200 s on a busier laptop, 87 → 99 checks). `party`: the owner's iPhone view (every tower's sky beam behind the sign, the rotating palette, the motion share at phone size, half-time, the NEON logo's punch, a 30 Hz phone keeps its tier); `panel`: JUST ME live, EVERYONE via `city2/live` on two phones in sync, a link's own flags win, the JUST ME chip + ✕, PARTY ON by day = the party link, every sky event fired from the panel appears. **WebKit:** not runnable on this machine (Playwright's WebKit install fails) — docs/harbor/passes/neon-pass-5.md (≈ 2 min, emulators: load + every flag, never saved, a normal visit
  untouched, HOST / JOIN / the knock, `city=2` kept in the URL through a refresh, the lanes vs the real sign, `setTier(1)` never blanking the stage, the tagline fading with nothing moving, a word + the searchlights, Part 4: the water live (rows, columns), calm vs windy, the HOTEL's red in the water, the hooks, golden's sun path, day glints, tier 0's still mirror, cleanup pass 1: a calm night drawing ~30 frames a second, a hidden page drawing none and resuming at 60, Part 5: the tagline resting with the dock and back on a tap, the wheel's feet on its platform, the boats at night + the taxi keeping 60 fps, the lighthouse's 3-tap spin, the roof signs' beacons, frame pacing at 4× CPU vs the 8 ms budget, 20 title ↔ setup cycles' memory); the look:
  FP3a — THE LOAD as a burst on a phone's network: `node shots.mjs "<browser>" --city 2 --safe --scenes day --sizes 402x874 --load --net 3g
  --cpu 4 --every 300 --count 24` (`--load`: the shots start at the navigation itself; `--net 3g|4g` a cellular network, a fresh
  context = no cache; `--cpu N`). (THE POLE's party colours are a hard check again since FP3a: the probe was on the glass's LED core.)
  `node shots.mjs "<browser>" --preview --city 2 --safe --sizes harbor --scenes day,golden,night,party,rain,snow` (`--crop stage|skyline`,
  DT2 — THE CLOUDS without the title: `tests/integration/clouds-preview.html` (every kind in every light on the real layout, no Firebase: `?looks=morning,noon,cloudy,golden,sunset,dusk,dawn,blue,night,party,overcast&cover=0.55&z=2&res=3`), shot with `node shots.mjs "<browser>" --page "tests/integration/clouds-preview.html?looks=noon,golden" --sizes 1700x1100 --name clouds` (`--page`: any page of the site, full length, once its body has `data-ready`); a frame burst of the drift: `--scenes d-clouds --qs speed=30 --every 1500 --count 4`. THE DAY PASS: the scenes `d-morn,d-noon,d-aft,d-golden,d-clouds,d-overcast,d-night,d-party` (Oct 22: day vs night side by side) + the crops `skyl3,skym,skyr3` (the skyline's thirds), `--qs "force=tired&letter=O"`, `title-perf.mjs --scenes np-clouds` (a cloudy day); `--qs grid=1`, `--qs "tagms=500"` to see the city without the tagline, `--qs "force=spell&text=2027"`, `force=searchlights`, Part 3: `--crop skyl,skyr,logo` close-ups, `--qs "force=neon-party"`, `force=anchors`; Part 4: `--crop water` + the scenes `calm,windy,moon,sunset`, `&wind=<m/s>`, `force=no-water`; Part 5: `--crop wheel,lighthouse,rosie,harbor`, `--every 1000 --count 8` (a burst: the beam turning, the taxi, the wakes), `--qs "wx=fog"` (the beam at its widest), `force=taxi` (crossing non-stop), `force=wheel-scheme&scheme=halloween`, `force=beam-green`, `force=rosie-lights&scheme=parade`; when a boat is where: core/harbor-boats.js#boatAt; Part 6a — THE EVERYDAY SKY: `--crop sky` + the scenes `sky-day,sky-night,sky-golden,banner,skywrite,skytype,helicopter,helicopter-day,balloons-dawn,balloons-dusk,gulls,geese,swifts,moonrise,harvest,crescent,crescent-dawn,eclipse,aurora,drones,drones-launch,drones-text` (each forced piece; a scene's own wait), the flags in docs/harbor/passes/part-6a.md); the games' tube logos: `tests/integration/logos-preview.html`; 8P — THE PEOPLE's figures without the title: `tests/integration/folk-preview.html?light=day|night|gold&scale=2&season=…&party=1&rain=1` (a walk cycle per look, the jog, every pose, arm in arm — `--page "tests/integration/folk-preview.html?light=night" --sizes 804x1060 --name folk`); the people in the city: `--qs force=line&n=6`, `force=bus`, `force=no-people`, `force=hushsign&hush=JAZZ`; cost per scene + tier for either city: `node title-perf.mjs "<browser>" [--city 2] [--scenes party,night,day,golden,show,neon,np-party,np-night,np-day,np-golden,np-windy,nw-night,nw-party,nw-neon,h-night,h-day,h-worst] [--cpu 4]` (np- = without the planes; nw- = also without the live water, a before / after; h- = Part 5's harbor with the taxi crossing non-stop, h-worst = the neon's party + searchlights + a word + real fog; one piece off at a time: h-nb (no boats), h-nw (no wakes), h-nwh (no wheel), h-nbm (no beam), h-none; Part 6a's sky: s-day, s-night, s-banner, s-skytype, s-heli, s-drones, s-aurora, s-worst (a party peak + the drone show); the same off-switches as flags: `&force=no-boats|no-wakes|no-wheel|no-beam`; on a real phone: `?city=2&debug=1` shows the frame-time readout); an A-B-B-A against an older commit: `git worktree add <dir> <commit>`, `node scripts/serve.mjs 5174` there, then **C1.5 — THE GATE:** `node title-perf.mjs "<browser>" --city 2 --ab http://localhost:5174 --scenes np-night,np-party` interleaves A B B A A B in one run itself (the idle page hidden, settled windows, a window whose tier moved thrown away), judges frame pacing then work against the windows' noise → `same` / `faster` / `SLOWER` (exit 1); the absolute budgets are warnings; `--vs <scene>` = a flag's cost on one server (`--scenes np-party --vs n4-punch`); tier 2 on a party night needs `--cpu 1–2` (at 4× without a GPU it steps itself down). **No look change:** `node pixdiff.mjs "<browser>" [--scenes night,party,noon,golden,halloween,stpatrick,dusk,night-nc,party-nc,dusk-nc,golden-nc] [--aq '&flag=…']` (DT2: `dusk` = the blue hour; `-nc` = the same look without its clouds — a clouds pass proves the rest of the frame is untouched) — A (:5174) vs B (:5173) still frames (reduced motion + a seeded random), an A-vs-A noise floor, `<scene>-diff.png` (magenta = beyond the noise); `--burst 8 --gap 250` = side-by-side moving frames. The harbor E2E's `perf` group: the numbers are warnings (C1.5), MEMORY is read at tier 0
  (City 2.0: add `&force=no-planes` to a raw scene query — a plane's growing contrail skews the later tiers, docs/harbor/passes/part-2.md#known-issues-part-2)
  (no emulators). The emulators need Java: on the mini PC Temurin 21 is on the PATH (the old laptop's own JRE lived at
  `~/.cache/neural-arcade/jre/jdk-21.0.12.1+1-jre/bin`).
- **HOLD'EM (HE1):** `node --test tests/holdem-rank.test.mjs tests/holdem-table.test.mjs tests/holdem-match.test.mjs tests/holdem-sim.test.mjs` (≈ 7 s — the 2.6 M-hand proof, rigged hands, matches, ≈ 30,000 robot hands of invariants); the length study `node scripts/holdem-sim.mjs` (not in npm test) — docs/holdem.md.
- **PLAY NOW's checks (Nov 13 — docs/harbor/passes/play-now.md; the emulators + `serve.mjs --emu`; Playwright from `~/wk`):**
  `e2e-playnow.mjs [--browser webkit|chromium] [--only solo,friends,holdem,sign]` (the shelf → the card → a solo run in one tap → PLAY AGAIN → BACK TO
  THE CITY + the parked line; PLAY WITH FRIENDS; HOLD'EM's card; a sign tap — `&conngrace=4000`) · `wk-onebuild.mjs [--browser …]` (ONE DEPLOY AT
  A TIME: build B published under an open A page, THE LINE's own ports 5187 / 5188) · `wk-trivision.mjs [--only plain,reload,hidden,artfail]`
  (the roof board on a PLAIN load; `HIDE_MIN=` shortens the 10-min hidden case) · `wk-floor.mjs` (iOS 15.4's missing APIs taken away) ·
  `wk-edge.mjs` takes `PATHS=1` (each visit's /api paths). `kit/two-cameras.mjs`: `wx-late@HH:MM` (the LATE WEATHER at a set clock).
- **HOLD'EM's DEALER (HE2):** `tests/holdem-dealer.test.mjs` (npm test — the pure core) + on the emulators (database + auth), RUN ALONE (it loads the
  real rules into the server's namespace `demo-arcade-default-rtdb` to read AS each phone): `cd tests/integration && node --test holdem-server.test.mjs`
  (≈ 2 min — whole matches through `holdemAction`, THE LEAK SCAN every step, the cost line `# holdem cost` + `# holdem bytes`). The seeded rng + clock
  go in through `setTestRng` / `setTestClock` — honoured only under the emulators. HE3 adds `# holdem wire` (THE LEAN WIRE's bytes a publish) + the
  heal / the console's start / the room kept active.
- **HOLD'EM's SOUNDS + CHIPS + SKINS (HE5):** npm test — `tests/holdem-sound.test.mjs` (the event map, the gain table, the deals' spacing, nothing on a
  refresh, a whole match's cues), `holdem-chips.test.mjs`, `holdem-skins.test.mjs`. In a browser (any local server): `node tests/integration/he-sfx-measure.mjs
  "<browser>"` (each file's lead-in + the busiest overlap through the limiter — exits 1 on a clip) · `node tests/integration/he-sound-demo.mjs "<browser>" [s]`
  (the motion demo on a REAL audio context: every planned cue started) · the chips close up: `tests/integration/holdem-chips.html`. The E2E checks the sound
  PLAN silently (`__holdem.planned()` — headless audio stays locked).
- **HOLD'EM's REAL CARDS + SKINS + PICKER (HE6):** npm test — `tests/holdem-cards.test.mjs` (every card × size × deck, the pip counts, the court sprite of
  the deck, our own ace of spades, only this deck's sprite preloaded) + `holdem-skins.test.mjs` (the three skins' nested shape, the CSS reads every variable, only
  its own files, ≤ 200 KB each). The look: `tests/integration/holdem-cards.html` (the faces close up — `&deck=two`, `&skin=`, `&all=1`), `holdem-chips.html?skin=`,
  the preview's `&skin=casino|cabin|apartment` + `&settings=1` (THE TABLE picker open) on every state, `holdem-shots.mjs --skin casino,cabin,apartment`. The FULL
  E2E adds a LIVE SKIN SWITCH mid-hand on one phone (cabin → apartment → casino: the felt, the backs, the living touches, no reload, only skins' own files
  fetched) + THE BUSIEST MOMENT's 60 fps in EACH skin.
- **HOLD'EM's SIDEWAYS VIEW + DESKTOP (HE7):** npm test — `tests/holdem-wide.test.mjs` (6 sideways phone sizes × 2–8 players: no overlaps, the
  even spacing, the sizes, THE STAGE). Any local server: `node tests/integration/holdem-rotate.mjs "<browser>"` (10 turns mid-motion, a desktop window,
  ≈ 40 s) · `holdem-pixdiff.mjs "<browser>" --a http://localhost:5174` (THE PORTRAIT UNCHANGED vs a worktree of the commit before) · `holdem-probe.mjs`
  · `holdem-shots.mjs --sizes 844x390,932x430,667x375,1440x900`. The FULL E2E: ROTATE MID-HAND, ONE WHOLE HAND SIDEWAYS at 8 (one a desktop) on real
  uncovered taps, the busiest moment SIDEWAYS in each skin — docs/holdem.md "HE7".
- **HOLD'EM's OWNER'S LIVE TEST + TOUGHNESS + LONG NIGHTS (HE8):** npm test — `tests/holdem-owner.test.mjs` (only the owner's phone offers HOLD'EM · TEST; only the
  radio gate sets it, only the room's host list reads it; the server gate's lines). The emulators: `holdem-server.test.mjs`'s HE8 case (the dealer's start
  refuses a non-owner host while `playable: false` — the live rule switched on by `testHoldemGate`; the owner via ADMIN_PIDS / `testAdmins/{pid}`).
  e2e-holdem FAST starts as a REGULAR host since HE10 switched HOLD'EM on (LOAD FIX 5's add-on: in the list with no TEST tag, a guest can't start it — the owner gate's own proof is `holdem-owner.test.mjs` + `holdem-server.test.mjs`, which flips the row to `playable: false` in-process) + checks THE WAKE LOCK; FULL adds THE TOUGHNESS (`TOUGH_ONLY=1 N=4` = the start + it alone, ≈ 2.5 min:
  a slow line via CDP, `setOfflineMode` 10 s / 10 s on your turn / 40 s into the bank, a 30 s app switch, a counted wake-lock stub). Any local server:
  `node tests/integration/holdem-endurance.mjs "<browser>" --hands 400` (THE ENDURANCE RUN at `&speed=12` ≈ 9 min — heap / DOM / listeners / canvases flat —
  + THE IDLE PROOF: 0 animation frames on an idle table; `--hands 60` for a quick look). The preview: `&clk=` `&bank=1` (your timer), `&speed=K` (the demo).
- **HOLD'EM's BET SLIDER + FR7-B's leftovers (HE11):** npm test — `tests/holdem-bet-steps.test.mjs` (THE BET STEPS over every stack × level) +
  `tests/holdem-he11.test.mjs`; the emulators: `holdem-server.test.mjs`'s HE11 cases. Any local server (WebKit — `~/wk` Playwright):
  `E2E_BASE=http://localhost:<port> node tests/integration/wk-holdem-slider.mjs` (a drag across at 402 × 874 @3, − / +, a preset, HOLD, CONFIRM once —
  the preview's /api stubbed on the page: `window.__fakeToken` makes fake-firebase's `idToken` resolve). `holdem-shots.mjs --only slider-8`.
- **HOLD'EM's TABLE (HE3):** npm test — `tests/holdem-wire.test.mjs` (the parts round-trip, every diff, the bytes) + `tests/holdem-phone.test.mjs` (the
  phone's pure side + THE LAYOUT at 2–8 players on five phones). The look: `tests/integration/holdem-preview.html` (no Firebase — docs/holdem.md
  "THE PREVIEW") + `node tests/integration/holdem-shots.mjs "<browser>"`. The E2E (the emulators + `serve.mjs --emu`):
  `FAST=1 node tests/integration/e2e-holdem.mjs "<browser>" ./shots-e2e-holdem` (≈ 35 s) / the full 8-phone path (≈ 3.5 min; `CASH_ONLY=1`).
- **Unit + simulation (no deps):** `node --test tests/*.test.mjs` (214 tests: rules of all ten games (GRIDLOCK: tests/gridlock.test.mjs — placement, private resolution, points + bounty, Classic 2/3/4 + Royale 8 whole matches, the cap; SLIPSTREAM: slip + slip-course, incl. bot rides proving courses survivable) (DOUBLE AGENT: tests/agent.test.mjs; PRISM DROP: prism-engine + prism) incl. Overclock's 20 types (the six update-2 types + banks + order spread in tests/overclock-2.test.mjs) (Lexicon sets, Rewire solvability, no-repeat order) incl. NEON PAR physics + director, chat locks + profanity filter (banks checked too), host-migration replays,
  seeded generation, trivia parsing, both question banks)
- **Several players on one computer:** open the site in multiple tabs: `/?slot=2`, `/?slot=3`, … (slot 1 = no param).
  Each slot is a separate anonymous user + saved session; the slot sticks to the tab across refreshes.
  Opening the *same* slot in two tabs shows a warning (they'd be the same player). Separate browser profiles / incognito also work.
- **Local emulators (rules + E2E):** needs Java 11+ and Node.
  ```
  cd tests/integration && npm install
  npm run emulators        # = firebase emulators:start --only database,auth --project demo-arcade --config ../../firebase.json
  ```
  (`firebase.json` lives at the repo root — firebase-tools refuses rules files outside its project directory.)
  - Rules tests: `node --test rules.test.mjs`
  - App against emulators: `node scripts/serve.mjs --emu` then open `http://localhost:5173/?emu` (add `&slot=2` …). `?emu` only works on localhost.
    `--emu` also runs the `/api` functions on the emulators (`npm install` at the repo root once, for firebase-admin); env
    `MATCH_GAP_MS=0` lets the E2E suites count back-to-back matches, `ADMIN_PIDS=<pid>` opens `/admin` for that profile.
  - RUMRUNNER: `node --test ../rum.test.mjs ../rum-text.test.mjs`; `FAST=1 node e2e-rum.mjs "<browser>" ./shots-rum` (≈ 5 min, a 15-day match with
    bots); the full run (`N=4..8`) adds a refresh mid-day, the host killed, a late joiner, music + mute and frame pacing. Look without
    Firebase: `rum-preview.html?at=day&day=7&n=4` (see docs/rum.md). Balance: `node scripts/sim-rum.mjs`.
  - HIGH STAKES: `node --test ../stakes.test.mjs`; `FAST=1 node e2e-stakes.mjs "<browser>" ./shots-stakes` (≈ 4 min, a whole match with
    bots); the full run (`N=4..8`) adds a refresh mid-bet, the host killed, a late joiner, music + mute and frame pacing. Look without
    Firebase: `stakes-preview.html?at=bet&n=6` (see docs/stakes.md).
  - **Profiles + boards** (`docs/profiles.md`): `node --test ../profiles.test.mjs` (pure: week keys, XP, name filter, keys, catalog, every
    game's results + plausibility, with `tests/fixtures/finals.mjs`); `node --test server.test.mjs` (the `/api` functions on the
    emulators: creation, migration, restore, regen, renames on every board, opt-out, forged / impossible / duplicate / offline
    reports, weekly vs all-time, rank outside the top 100, XP rank-ups, admin, the name filter, every game + every GRIDLOCK mode, the
    HTTP layer with real ID tokens); FRIENDS A: `node --test friends.test.mjs` (in tests/integration — the friends list, invites + their push to a local receiver, invite notifications, THE CREW INTERCOM; alone) + `node tests/integration/e2e-friends.mjs "<browser>" ./shots-friends` (two browsers: ADD → the badge → ACCEPT → the green dot → INVITE → the waiting card → JOIN → the push link → BLOCK; ≈ 1 min; its shots = the look review at 390 / 402 / 430 / 1440) + `node tests/integration/wk-keychain.mjs` (WebKit 402×874 @3: SAVE TO PASSWORDS is a proper credential form, nothing sent, the restore field autofills); PROGRESSION B: `node --test sightings.test.mjs` (in tests/integration — the sighting verdict, birthdays, favors on the emulators; run it ALONE, like the others: they each wipe the nodes they use); PROGRESSION A: `node --test progression.test.mjs` (in tests/integration — the daily contract with the fake daily, the outage, a real report's awards, wearing, X%, the events, FOUNDER; the emulators); the pure suites `tests/{levels,streak,achievements,daily}.test.mjs`; the harbor `progress` group (the dock flame, the preview links); the look page `progress-preview.html?view=moment|streak|card|profile|flame`. `node e2e-profiles.mjs "<browser>" ./shots-profiles` (the flow in browsers: automatic profiles,
    migration, emblems in the lobby, podium plaques + XP + RANK UP, an unreachable server's queued report delivered once, the key
    reminder, restore in a fresh browser, a new key retiring the old, THE BOARD with the pinned rank, opt-out, the public /board).
    Looks without a server: `board-preview.html` (`?mode=public&g=pulse&c=records&p=all&far=1&anon=1&empty=1&err=1`),
    `results-preview.html` (`?case=first|top10|world|pb|merged|rankup|legend`), `emblems-preview.html`; `og-board.html` renders the
    /board link preview (`render-assets.mjs` writes assets/og-board.jpg).
  - **PRESENCE + THE HOST (APP FIXES, Nov 1, ~35 s; in the cloud's tests job after CONN):** `node tests/integration/e2e-presence.mjs "<browser path>" ./shots-presence`
    (`SHOTS=0`) — three phones play LAST SIGNAL: a lobby left before its chat strip loaded leaks none (the module held on a slow line);
    a guest refreshes mid-question + the old page's late onDisconnect → still online, the question waits for them; the presence node
    wiped to "offline" → the phone heals itself; the HOST refreshes + the late onDisconnect → not deposed, no phone even tries to claim.
    CONN also checks THE TITLE's CLOCK (a stubbed /api/time 5 s ahead → serverNow follows, 0 sockets).
  - **CONN — THE DATABASE CONNECTIONS (Oct 28, ~1.5 min; in the cloud's tests job after the smoke test):** `node e2e-conn.mjs "<browser path>" ./shots-conn`
    watches every page's WebSockets through the DevTools protocol and counts the open database sockets in each state — a first visit's
    title (City 1.0 + 2.0): **0**; HOST: 1; JOIN by the hush word + by an invite link from a parked start: 1; a game: 1 each; a refresh
    mid-game resumes (1); a hidden tab IN a room keeps it; a host whose page is FROZEN mid-game (`Page.setWebLifecycleState` — a locked
    phone) hands over as before; QUIT → 1 through the grace, then **0**; HOST again from a parked title; a hidden title tab with no room → 0;
    /board + /admin: 0; never the SIGNAL LOST banner on a parked title. `&conngrace=` / `&connhid=` (ms, `?emu` only, kept for the tab)
    shorten the 30 s grace + the 2 min hidden wait; `MEASURE=1` prints the table without judging (a BEFORE run on an older commit), `LINE=1`
    each state's line (`window.__arcade.line()`: net, the reasons, the last changes, `touches` = dbRef calls nobody wanted).
  - **Smoke test first (~2 min):** `node e2e-smoke.mjs "<browser path>" ./shots` (DT1: `GAMES=cipher` runs only those — the one-game check a City 2.0 pass runs after touching a shared file; `shots.mjs` names a custom crop by it: `-c0x420x150x140`; Oct 24: it sends startGame / backToLobby to whichever tab is the host NOW and retries back-to-lobby from the current host — on GitHub NEON PAR's software WebGL can starve a tab's host beat and the other phone takes over, which made `golf: back to lobby` time out) — two REGULAR phone tabs (no `?slot=`; every
    other suite uses test slots, which once hid a lobby bug that printed "null" only on a real phone): create/join, lobby, HOW TO
    PLAY, all six games started and watched, back to the lobby. Fails on visible "null"/"undefined"/"NaN"/"[object Object]",
    page errors or console errors. Native `append()`/`replaceChildren()` print a `null` argument as text — `h()` skips it.
  - E2E (3 headless tabs play a full match incl. host loss + refresh + kick): `node e2e.mjs "<path to chrome/edge>" ./shots`
  - Same E2E against production (real Firebase): `E2E_BASE=https://neonspeakeasy.com node e2e.mjs "<browser path>" ./shots`
  - PULSE E2E: `node e2e-pulse.mjs "<browser path>" ./shots` (env `N=8 COUNT=2 SONG=pulse3 DIFF=hard ECHO=on`) — calibration
    (bot taps 40 ms late → ~+55 ms), synced start, bots with different timing (judgment checks), chords, refresh mid-song,
    backgrounding, quality-tier fallback under 12× CPU, 4× CPU frame pacing (`PROFILE=1` prints a CPU profile), Echo, podium.
  - NEON PAR E2E: `node e2e-golf.mjs "<browser path>" ./shots` (env `N=8 MODE=full|quick6|quick3 HOLES=n SHOTS=0`) —
    lobby ball picker, intro cards, a real slingshot drag + cancel, bots that aim with the physics engine, ACE on every
    phone, ghost smoothness (60 Hz probe), refresh mid-roll (exact replay), host killed mid-hole + rejoin, power-ups,
    sabotage, the 30 s countdown, scorecards, final, rematch, renderer memory per hole, 4× CPU frame pacing.
    Validation bot: `node scripts/validate-holes.mjs` (all holes, ~3 min) / `QUICK=1` (coarse).
    `GPU=1` uses the real GPU (frame pacing; default is software WebGL). Scene-only preview (no Firebase):
    `tests/integration/golf-preview.html?hole=6&tier=2&ghosts=7&at=tee&fly=1`; render profile of every hole at 4x CPU and
    phone pixel density: `node golf-profile.mjs "<browser path>" [tier]` (measured: 60 fps on all nine at the high tier).
  - Chat E2E: `node e2e-chat.mjs "<browser path>" ./shots` (env `N=8`, `GPU=0` for software WebGL) — 8 players: real-UI
    sends, grouping, typing indicators, unread + sound, profanity toggle, throttle hint, rules-rejected send → retry,
    offline send, fake-keyboard layout, kick (access lost), late joiner + refresh history, system lines, lock/unlock in
    all six games (badge counts, no sound/toast), golf frame pacing while the room chats, host clear (40 checks).
  - THE PASSWORD (PW1 — docs/password.md): `DAILY_TEST=1 node scripts/serve.mjs <port> --emu` + `E2E_BASE=http://localhost:<port> node e2e-password.mjs
    "<browser>" ./shots-password` (≈ 40 s; its own page password-daily.html — the real view + the real /api judge; a second phone fails door 1); `/api`:
    `node --test password.test.mjs` (in tests/integration, the emulators); the look: password-preview.html (a fake judge, fixed test words — docs/password.md).
  - COAST CLEAR (CC1 + CC2 — docs/coastclear.md): the same server (restart it after changing logic.js — it keeps the modules it loaded) +
    `E2E_BASE=http://localhost:<port> node e2e-coastclear.mjs "<browser>" ./shots-coastclear` (≈ 35 s, 36 checks — CC2: the sweep, look flips mid-run, the
    end screens, resume onto the end, the sounds + the first-tap catch, 60 fps on the preview; its page coastclear-daily.html); THE GHOST RUN simulation:
    `node scripts/sim-coastclear.mjs [runs] [seed]`. **THE LOOK FLIP in an E2E** (CC2 Group 0 — the old e2e-password flake): flip `body[data-look]`, then wait
    for the look's painted layer to be fully in AND no CSS transition running inside the screen (`document.getAnimations()`) — never a fixed sleep; take a
    colour BASELINE only once the screen has settled too; `/api`: `node --test coastclear.test.mjs` (ALONE — it wipes the nodes password.test.mjs uses); the look:
    coastclear-preview.html (a fake server, a fixed no-guess test board, `&state=` — docs/coastclear.md).
  - Overclock update 2: `node e2e-oc-2.mjs "<browser path>" ./shots` (N=8 — SHELL 2.0 B1: on the room in the city; it needs 4+ phones — N=4 SHOTS=0 ≈ 3 min) — Missing Link on the kit's letter keyboard (wrong guess shakes, a computer
    keyboard, plural, everything on screen at once — OC3), Spellcheck, Compass (MAKE 24 cut in OC2), Sort It with real touch swipes + side taps (host
    killed mid-challenge), Higher or Lower; identical puzzles everywhere, every player's points vs the scoring rule, all screens at both sizes.
  - PRISM DROP E2E: `node e2e-prism.mjs "<browser path>" ./shots-prism` (SHELL 2.0 B1: on THE ROOM IN THE CITY — GAMES → PRISM DROP → its options; **`FAST=1`** = 2 phones, the gestures, one battle to its end, back to the room, ≈ 40 s; the flick check = OFF by default, ON with SWIPE-DOWN SLAM) (env N=8, RUSH=0, CPU=4; `PERF_ONLY=1 GPU=1 N=2`
    = frame pacing only) — 8 players: same song/world/7-bag on every phone, real CDP touch gestures (drag 3 cells, taps,
    soft drop, flick, swipe up, sideways swipes never hard-drop), bots battle, junk attacks, targeting, notes in key + clears
    on the 16th grid, refresh mid-battle, song change mid-match (world + crossfade), host killed, 30 s offline = out, Call
    the Winner, KO credit + badges, FINAL DUEL + music lift, game-night bonus, Score Rush (next playlist song, reboot,
    finale on the last beat, results), refresh after a KO, no stray "null" (41 checks). Scene preview without Firebase:
    `tests/integration/prism-preview.html?world=city&v=2&tier=1&bot=1&fx=1&danger=0.5`; worlds + per-tier timings:
    `node prism-shots.mjs "<browser>" ./shots-prism [cpu]` (measured with GPU=1 at 4× CPU: 16.7 ms median at all tiers).
    PFIX-A (both paths, FAST included — ≈ 3 min now): **REFRESH** (`refreshAttackCheck` — a scripted 4-line clear, the page reloaded 400 ms later:
    the board comes back AFTER the clear, the same piece's clear replayed is refused by its key, the queues hold ONE [4] from it) + **AWAY**
    (`awayCheck` — a second tab brought to the front hides the phone 36 s: presence online, out after 30 s as AWAY, credited to nobody, the KO
    card says AWAY, the other phone wins; then a tap — a person picking the phone back up: the site's fade on leaving suspended its sound).
  - PRISM DROP's LEAK CHECK (PFIX-A — FABLE REVIEW finding 3): `node tests/integration/e2e-prism-leak.mjs "<browser>"` (≈ 2 min; the emulators +
    `serve.mjs --emu`; env `MATCHES=6` — 30 for the long log, `GAME=overclock` = the same probe on OVERCLOCK, report only; `RETAINERS=1` prints
    the shortest strong path from the GC roots to match 1's screen — a heap snapshot through CDP, the root tagged with a named object): two
    phones, BATTLE then REMATCH × n; probes before the page's scripts (every canvas by WeakRef + its pixels, the convolvers made) + CDP's DOM
    nodes / listeners after two forced collections, on the host's phone at 390 × 844 @2 at each podium → the table + the checks: the old match
    roots collected, live canvas MB flat (≤ one match's worth, 12 MB), nodes + listeners flat, no convolver after the first match. **Never keep a
    puppeteer ElementHandle in a memory probe** (`waitForSelector`'s return is a DevTools global handle — it pinned the podium and so match 1's
    whole screen: the test waits through `waitForFunction` + disposes).
  - GRIDLOCK E2E: `node e2e-gridlock.mjs "<browser path>" ./shots-gridlock` (env N=8, SHOTS=0, GPU=1, PERF=0, CPU=4) — CLASSIC with 2:
    lobby card/options, a real touch drag from the tray onto the 10×10 grid, tap to rotate, an invalid drop (red ghost, snaps back),
    AUTO-PLACE keeps your ships, READY, privacy (another player's read of your fleet is denied), an aimed shot through the HUD
    (tap a cell → reticle → FIRE), turns alternate, a timed-out turn fires a random shot, refresh mid-match (fleet + marks back),
    bots to the end, results. ROYALE with 8: 8×8, a phone that never placed gets a host fleet, TARGET LOCK (who, not where),
    two players on one cell, an absent owner's board resolved by the host, the bounty on the points leader, eliminations, Call
    the Winner, the host killed mid-match, a finish; frame pacing per tier at 4× CPU. Screens at 390×844, 412×915, 1440×900.
    Part 2 (`PART2=0` skips): the four mode cards; SALVO with the room (allowance = ships afloat, a marker past it replaces the
    last, tapping one lifts it, a refresh keeps the unsent markers, the lock-in names who and hides where, every marker fires,
    results carry shots + accuracy); ARCADE (two cards each, the hand, the first card armed + aimed by kind, a refresh keeps the
    armed card, the lock-in carries it, its event kind in the volley, the card is public at resolve and leaves the hand, SONAR's
    private readout + another player denied the answer, bots at 100 % then 60 % abilities, the host killed, a finish with
    abilities in the results). Balance: `node scripts/sim-gridlock.mjs [matches] [salvo,arcade,royale] [--weights=…]`.
    A stall under bots: `N=2 SECS=150 MODE=arcade node gl-arcade-probe.mjs "<browser>" ./shots-probe` prints the phase, the lock-ins,
    the resolutions and every bot's plan every few seconds (this is how a fizzled torpedo's `undefined` cell was found).
    Look preview without Firebase: `gridlock-preview.html?at=place|aim|reticle|locked|show|sunk|elim|spec|end&n=2..8&still=1`
  - OVERCLOCK (OC1): `overclock-preview.html?type=<any challenge>&at=brief|ready|play|right|wrong|answer|combo4|combo10|kit&n=1..8&final=1&piece=numpad|keyboard|tach|answer`
    (the real view in its OVERDRIVE skin, no Firebase; `body[data-ready]` marks the moment for `shots.mjs --page`); the kit's pieces unskinned:
    `kit-preview.html?piece=numpad|keyboard|tach|slam|answer`. Frame pacing of any page: `shots.mjs … --page <p> --fps 3000 [--cpu 4] [--js …]`.
    Unit: `tests/overclock-oc1.test.mjs` (the night memory, the skip, the combo, the timings pinned, the countdown 0–12, the assets + budget),
    `tests/kit-oc1.test.mjs` (the kit's pure parts).
    mounts the real view through an import map that swaps `js/firebase.js` for `tests/integration/fake-firebase.js`
    (no-op writes, empty reads) — the pattern for any game's preview; `window.__preview.volley({…})` plays more volleys.
  - Lobby header look: `SHOTS=1 node lobby-shot.mjs "<browser path>" ./shots-lobby` (creates a room, screens at the three sizes).
  - SFX without speakers: `sfx-probe.html?game=<id>&names=a,b,c` renders a game's `createSfx()` effects in an OfflineAudioContext
    (import map → `fake-engine.js`) and prints peak / RMS / length per effect — nothing silent, nothing clipping, the mix sensible.
  - SLIPSTREAM E2E: `node e2e-slip.mjs "<browser path>" ./shots-slip` (env N=8, SHOTS=0, GPU=1; frame pacing on its own:
    `PERF_ONLY=1 GPU=1 N=2` at CPU=4 — measured 16.7 ms median / 17 ms p95 at every tier, 4–5 ms of work a frame) — lobby card/options/ride picker, the same course on every phone, real touch (hold keeps you down, a tap
    in the air flips), bots ride, ghosts + their looks, equal look-ahead portrait/landscape + rotating mid-ride, every biome's
    audio treatment, refresh mid-ride, crash -> rewind -> respawn, eliminations + announcements, Call the Winner, ghost
    smoothness while spectating, host killed, LAST RIDERS, winner, results, rematch (playlist moves on, new course).
    Look review without Firebase: `slip-preview.html?biome=storm&ghosts=5&tier=2` (+ `flip=1`, `ride=cycle`, `trail=wall`) and
    `node slip-shots.mjs "<browser>" ./shots-slip [seed] [only=dunes,flip] [sizes=0,2]` (every biome at every size; PERF=1 prints tier timings).
    Perf lesson: never read layout (getBoundingClientRect / clientWidth) in the frame loop — the HUD changes every frame, so it
    forces a full layout (that alone cost ~10 ms a frame at 4× CPU); sizes come from ResizeObservers. Screens at 390×844, 412×915, 844×390, 915×412, 1440×900.
  - DOUBLE AGENT E2E: `node e2e-agent.mjs "<browser path>" ./shots-agent` — 8 players: REMOTE match (card privacy per
    player, deal, reveal styles, refresh mid-clues, keyboard layout, blocked clue, timeout + offline skips, pins, debate
    chat, host killed mid-debate, tie = escape, agent leaves → void + re-deal, last-chance steal, final, game night) and a
    SAME ROOM match with 2 agents (agent vs innocent card measured identical: size, colour, luma, animation, sound, haptic).
  - Overclock new challenges: `node e2e-oc-new.mjs "<browser path>" ./shots` (N=8, ≈ 3 min) — True or False/Timeline/Closest Call/Rewire played
    through the UI, identical puzzles on every phone, scoring vs the host's results, host killed mid-Timeline, refresh
    mid-Rewire, every new screen + reveal at 390×844 and 412×915. OC2: a tap lands DURING the ×4 + ×10 combo cues (nothing over the play
    area), THE ANSWER first, a READY mark on another phone, a refreshed phone on the same beat, 8 standings rows above the footer; then the
    host jumps the match to its last challenge → every final beat, one phone's SKIP ›, a refresh on the final standings, the host killed
    there, THE VICTORY body in the console's frame (39 checks).
  - THE MOTION PROOF (OC2): `shots.mjs --page "tests/integration/overclock-preview.html?type=trivia&at=wrong&hold=1" --cast 1000 --strip 8 --webm --js "__go()"`
    — a CDP screencast started before `--js`; `--strip N` = N frames evenly in time on one row, `--webm` = the frames at their real times.
  - DUMB LUCK (OC5): `node tests/integration/e2e-oc-luck.mjs "<browser path>" ./shots-oc-luck` (N=8, ≈ 1.5 min, the emulators) — a QUICK
    match with DUMB LUCK first: the neon sign, the same field on every phone, real taps (several on one horse, the 12-1, a changed pick, a
    phone with no pick), THE LOCK + THE DRAW replayed, a REFRESH mid-race, THE HOST killed mid-race (nothing re-drawn), THE FINISH, the
    payouts, THE ANSWER, WINNING TICKETS / THE HOUSE WINS, the shared round-win rule. The rules: `tests/overclock-oc5.test.mjs` (the
    200,000-race simulation, the draw's unpredictability, 10,000 race scripts, the placement, whole matches, the daily plug-in); the HORSESHOE +
    THE QUICK SOLO BOARD in `tests/profiles.test.mjs` + the profile E2E (§10). The guard's `luck` group = every Dumb Luck screen.
    OC8: the luck E2E also proves THE LOCK GRACE — FINN taps at 6.9 s through a transport that holds every WebSocket send 300 ms, and the pick
    still has its ticket.
  - THE SLOW-3G START (FRIENDS C): `MOUNT=1 SLOW=1 node tests/integration/e2e-oc-slow.mjs "<browser path>" ./shots-oc-slow` — Chrome's Slow 3G
    (400 kbps, 2 s), 2 phones: when each phone's match screen mounts after the start's stamp, the guest within 2 s of the host; `LOBBY=30000` =
    30 s in the lobby first (the guests wiring the cartridges — js/games/preload.js); without it the lobby's own wiring is off (A: the start at
    once). The local server is HTTP/1.1 (six connections) — the no-lobby case is slower here than on Vercel's HTTP/2. `tests/preload-graph.test.mjs`
    = the generated module list fresh (`node scripts/build-preload-graph.mjs`).
  - A POOL CHALLENGE FIRST ON A SLOW LINE (OC8 — A6): `node tests/integration/e2e-oc-slow.mjs "<browser path>" ./shots-oc-slow` (2 phones,
    ≈ 40 s, the emulators) — every phone on Chrome's Fast 3G profile, TRIVIA forced first (`?emu` + `window.__ocFirst`): the pool's fetch begins
    in the walk inside on every phone, the deal carries the night memory, the questions are on screen the moment the challenge can open (the
    screen's own mount time is logged — a 3G joiner mounts late: the cartridge's module waterfall). `NET=0 LATE=1` = THE LATE DEAL's proof (the
    host's trivia request held `HOLD` ms → `prepare()` deals it during the rules card).
  - THE CONTENT (OC6 + OC7 — the eight BUILT pools, docs/content.md "THE POOL BUILD"): `tests/overclock-content.test.mjs` (seconds — every item of
    the party pools + THE DAILY RESERVE: an id + a source, no duplicates (within + across the pools), the phone limits, fair pairs, solvable
    timelines on 25 seeds a theme, Sort It's disjoint sides + the computed sets re-computed card by card (`scripts/oc-pools/sortcheck.mjs`), the
    all-ages words, no template over ~8%, US units that read naturally, the pool sizes; OC7: trivia wrongs never an alias of the right answer,
    every MISSING LINK side recorded + every join a real word (Hunspell en_US / ENABLE) or a Wiktionary phrase (the committed verdicts — no
    download), SPELLCHECK's right word in en_US + no wrong one a word anywhere + `hard` = the common slip, the ~20% reserve agrees with the
    build's split) + `tests/overclock-oc7.test.mjs` (the OC7 shapes + deals by id; no js/trivia import in Overclock; js/trivia + its fallback
    bank hash-pinned for the other three games) + `tests/overclock-reserve.test.mjs` (THE DAILY RESERVE: ~20% of each pool; the local
    server answers 404 for `api/_data/oc-reserve/*` + `api/_lib/*` — upper case + encoded too; no shipped file names it; `daily.js#dayContent` =
    texts for the phone + answers for the server; OC8: the LOOK PAGES' DOOR — the `*-preview.html` + card-review pages import the server-only
    names as `/__dev/api-lib/<name>.js`, the local server only, never api/_data). Rebuild the pools: `node scripts/oc-pools/build.mjs --offline` (the committed caches).
  - NO SIDEWAYS SCROLL (OC3 — the owner's phone: the victory slid left): `node tests/integration/e2e-oc-sideways.mjs "<browser>"` (needs only
    `scripts/serve.mjs`; ≈ 11 min for all 48 screens × 390 / 402 / 430 — `ONLY=victory,answer,…` (a group or part of a name) · `SIZES=390x844`) —
    every Overclock screen on the preview: the document + every scroll box no wider inside than out (read twice), and a sideways swipe (the
    touch gesture + a sideways wheel) moves nothing. Run it after touching any Overclock screen.
  - OC3 — THE TYPING CHALLENGES on the preview: `type=math|pattern|closest|missinglink|unscramble&at=play|typing|right|wrong|answer` (pressed
    like a finger on the kit's pads), `&at=brief&still=1` = the rules card + its DEMO (pattern, missinglink); `__preview.typePad('123')` /
    `typeKeys('WORD')` / `typeTiles('word')` / `lock()` for a camera's `--js`. Unit: `tests/overclock-oc3.test.mjs` (Pattern Lock's easy opener vs
    a frozen copy of the old generator, the rule lines, the pads' reducers). The E2Es tap the pads: e2e-oc-2 (Missing Link: no input element,
    the keyboard on screen, a wrong GO, a COMPUTER keyboard's typing, SKIP), e2e-oc-new (Closest Call's number pad).
  - OC3B — THE CARD + LIST CHALLENGES on the preview: `type=spellcheck|higherlower|timeline|sortit&at=play|right|wrong|answer` (higherlower
    `&run=miss|time|perfect`), `&at=brief&still=1&type=higherlower` = its DEMO; `__preview.tap(k, right)` (a spelling, a call, a whole Timeline
    order + LOCK IT IN, a Sort It side tap) · `__preview.swipe(right)` (a real drag on the Sort It card — a camera's `--js`). Unit:
    `tests/overclock-oc3b.test.mjs` (Spellcheck's tricky / wrong letters on the whole bank, Higher or Lower's call = the same winner on 3,000
    dealt pairs, the four screens' step times pinned). The E2Es: e2e-oc-2 (Spellcheck's upright tiles, Higher or Lower's buttons + its demo,
    Sort It's touch swipes + its answer columns), e2e-oc-new (Timeline's rows + badges + LOCK IT IN + its answer; UNSCRAMBLE with REAL finger
    taps — tiles, a filled slot back, CLEAR, SHUFFLE, a wrong word then the right one, THE ANSWER on two phones).
  - OC4 — THE VISUAL / REFLEX CHALLENGES on the preview: `type=rewire|memory|stroop|oddone|count|reflex|compass&at=play|right|wrong|answer`
    (+ `type=count&at=close` — off by one), `type=oddone&fams=0,1,3&item=n` (0 letters · 1 rotation · 2 mirror · 3 neon shapes), `&at=brief&still=1
    &type=rewire|compass` = their DEMOS; `&tx=0..1&ty=0..1` = where the finger lands on a pressed element (the crack's impact); `__preview.wire(m)`
    (turn the first m tiles of a circuit's path into place — Infinity solves it), `mem(n)` (repeat the sequence, slipping at step n), `tap(k, right)`.
    THE CRACK's motion: `shots.mjs --page "…?type=trivia&at=wrong&hold=1&tx=0.3" --cast 560 --strip 8 --cast-el ".oc-tiles .oc-tile:nth-child(2)"
    --js "__go()"` — `--cast-el <selector>` (+ `--cast-pad`) crops the strip to that element at REAL size, `--cast-from <ms>` starts the strip's
    frames later (the motion, not the wait). Unit: `tests/overclock-oc4.test.mjs` (the crack's texture size + credit + preload budget + tap point +
    seeded plan; Odd One Out's families, the deal + the night keys, whole matches at 2 + 8 players; QUICK COUNT's exact flash; every screen's
    step times pinned from its source). The E2Es: e2e-oc-2 (Compass's N / E / S / W), e2e-oc-new (REWIRE + ODD ONE OUT with REAL finger taps — the
    blue stage 2, a refresh mid-circuit, the found cell white-hot, a wrong cell's real crack at the finger + the odd one green, THE ANSWER's rows).
    The no-sideways guard has an `oc4` group (right / wrong / close on nine challenges, the four families, both demos, Signal Lock's GO).
  - The E2E harness uses `puppeteer-core` with a locally installed Chrome/Edge (no browser download).
  - THE PEOPLE E2E: `ONLY=door,line,peds,rain,hail,bus,holidays,reduced,perf node e2e-people.mjs "<browser path>" ./shots-people`
    (env `SHOTS=0 CPU=4`; ~8 min) — the door's visits, the hint, the party line + its thinning, the people by the hour, umbrellas,
    spray, snow footprints, the cab hail end to end, boarding the bus, the holidays, Reduced effects, the worst real case's draw cost
    (`__district.cost()`, alternated with the street off). The knock → JOIN + the dock buttons: e2e-title `ONLY=knock`.
    Pacing lesson (Oct 21): frame intervals are quantised to 16.7 ms ticks, and the first page measured after a warm-up still runs
    slow — compare draw costs, alternated. A tier change rebuilds the scene (~1.2 s stall at 4× CPU): read a tier's frames after it
    settles. Sun checks wait for their condition (the sun follows the sign's text, which settles later on a busy machine).
    Bisect helpers: `TITLE_QS=…` (e2e-title's pacing page) and `SKY_QS=…` (every e2e-sky page) append preview switches.
  - THE STREET E2E: `ONLY=layout,lamps,trees,bus,signal,cars,plow,shadows,wind,party,reduced,perf node e2e-street.mjs "<browser path>" ./shots-street`
    (env `SHOTS=0 CPU=4`; ~7 min) — the layout at 390 / 412 / 1440 (pairs, clear of the blades, the door spot), the photocells at
    sunset, the trees by season, the bus at the shelter + its timetable + the owl, queues at red, flashing yellow, the car mix,
    plows only in snow, golden-hour shadows, wind + fallen leaves, the party lamps + chase + party bus + the midnight sequence,
    Reduced effects, pacing of a rainy party peak with the bus.
  - RAINBOWS E2E: `ONLY=trigger,choice,fade,sun,place,neon,reduced,flags,perf,media node e2e-rainbow.mjs "<browser path>" ./shots-rainbow`
    (env `SHOTS=0 CPU=4`; no rooms, ~4 min, media adds ~3) — the after-rain trigger through `&rained=` (just ended / still raining /
    dry / an hour later / overcast), which bow by time, moon, party and ALWAYS NIGHT, the fades (in, out, the neon powering off at
    60×), the hole around the sun, behind the towers + under the text at 390 / 430 / 412 / 1440, the neon's sputter and breathing,
    Reduced effects, the preview flags, pacing with and without a bow at 4× CPU. Looks: `shots.mjs --scenes rainbow,rainbow2,moonbow,neonbow --wait 10000`.
  - PARTY NIGHTS E2E: `ONLY=timing,beat,lobby,lights,street,finale,holiday,reduced,perf,media node e2e-party.mjs "<browser path>" ./shots-party`
    (env `SHOTS=0 VIDEO=0 CPU=4 SIZES=390,430,1440`; ~4 min without `media`, which records the review's videos — ~14 min) — the
    window and the phases incl. a June evening (the catch), the beat clock with music / muted / before and after the first tap,
    two lobby phones breathing to the room's song, the beams by phase and size, the street's traffic, the finale forced / live at
    midnight / once / not on NYE, Halloween colours with JOIN + corners white, Reduced effects, frame pacing at 4× CPU per tier.
  - THE LOBBY SONG E2E: `node e2e-lobbysong.mjs "<browser path>"` — real audio in headless Chrome: the host's mood song carries on
    into the lobby (same track, position continuous, the queue seeded with it), a joiner crossfades into it at the room's place, a
    joiner already on it doesn't restart, CLASSIC falls back to the room's own queue.
  - HUSH WORDS E2E: `node e2e-hush.mjs "<browser path>" ./shots-hush` (env `SHOTS=0`; run rules.test.mjs first) — a hush
    word on the host's card, JOIN by typing and by invite, LOCK THE DOOR (a new phone refused, a refresh and a dropped phone keep
    their seats), unlock, an old random-code room + its invite link, closing rests the word, picking with every other word
    resting / every word resting, the guessing guard; the card + JOIN panel at 390×844, 430×932, 412×915, 1440×900.
  - **Look reviews:** `node shots.mjs "<browser>" --scenes night,day,ramp,catch,dawn,first,join,halloween,christmas,valentine,rejoin,sun,rain
    --sizes quick|phones|desktop|pass|wide|ipad|sideways|desk-pass|all|390x844,… --place gr|ny|none --crop dock,corner,sign,win-<id>|x,y,w,h --qs "…" --guest --out ./shots-review`
    (DESKTOP, Nov 2: `--sizes pass` = 390 / 402 / 430 + 1440×900 — EVERY pass's look review; `desk-pass` = the desktop pass + FR6's set (1440×900,
    1920×1080, 2560×1080, 1280×720, an iPad both ways, a phone sideways); `--crop win-jazz|win-bar|win-back|win-apartment|win-edge2…` = one
    speakeasy window; `--every ms --count n --sheet [cols]` = the burst as ONE labelled contact sheet. e2e-harbor `ONLY=desktop` (~30 s) proves
    the desktop camera, the hover, Esc, the resize, the iPad + a phone sideways; `PS_CPU=6 ONLY=partysync` slows the party-sync pages 6× (the
    cloud's runner on this machine); title-perf `--dsf 2` = a desktop size on a DPR 2 screen.)
    (any moment: `--scenes name=2026-10-19T19:05`). Each shot in its own context; ~8 s per shot. `--preview` shoots
    `title-preview.html` instead — the real title without Firebase or the emulators (look reviews; flows need the app).
  - Title screen E2E by group: `ONLY=gate|flow|dock|neon|perf node e2e-title.mjs …` (gate = first visit / returning / skip; flow = HOST,
    JOIN, invites, REJOIN; dock = THE FLANK; neon = THE NEON COMES ALIVE; perf = tiers, frame pacing, memory). `ONLY=dock` ≈ 55 s.
  - Title screen E2E: `node e2e-title.mjs "<browser path>" ./shots-title` (env `GPU=1` for real frame pacing, `SHOTS=0 VIDEO=0`) —
    first visit (gate → full power-on, audio unlocked by the tap, timing measured in the page), returning visit (short),
    same-session (instant), skip, reduced effects, HOST with a saved profile, JOIN by typing / paste / ?room= (with and
    without a profile), a word with no room, digits ignored, REJOIN, EDIT, showcase previews + HOW TO PLAY, tiers at 4× CPU, memory
    across title↔setup cycles, hidden-tab pause; screenshots at 390×844 / 412×915 / 1440×900 and MP4s of the first and
    returning intro (CDP screencast + ffmpeg from the PULSE venv). `title-shots.mjs` = quick sequence stills + the bare boot screen.
    The E2E suites open `?emu` pages, where the title skips its intro (add `&intro=1` to see it).
  - Lighthouse (mobile): `npx lighthouse "http://localhost:5173/?emu" --form-factor=mobile --chrome-path="<browser>"`
    (`scripts/serve.mjs` gzips like Vercel so the numbers are representative).

- C4c — THE BLACKOUT, FOR REAL: `ONLY=blackout node e2e-harbor.mjs "<browser>" ./shots-harbor` (≈ 25 s) — the TR-3B at the blackout's depth on a
  late-October, a Thanksgiving, a December + a September night AT 3× (the benches' sharp overlays exist only above the city's 2×), every holiday
  piece drawn + both benches + every tree's crown (its brightest tenth too) + the hydrant vs the dark city round them. THE PHONE BENCH:
  SKY-B: `ONLY=boxer` (≈ 45 s: Mon 8:05 pm in his room + on the crisp layer, a Tuesday parked, the panel's preview on the bag, a Friday wrap-up) · `ONLY=stations` (≈ 60 s: two phones on one station in step, a station change, a late joiner) · THE PHONE BENCH now loads a FRESH PAGE per scene (sessionStorage), cools down, reports the frame side + WHAT COSTS THE PARTY (the PROFILE).
  `ONLY=bench` (≈ 15 s: no bench without the flag, the START card, two scenes at `&benchfast=1`, the report + its COPY + the send);
  `MEASURE=1 ONLY=bench` adds THE MEMORY GUARD's table (390 / 402 / 430 × the three tiers at a 3× phone + `&dpr=3`: what the bakes want,
  whether the old 24 / 40 / 64 MB budgets would have stepped a layer down, every live canvas). On a phone: `?city=2&bench=1` → START
  (≈ 3 min, keep the screen on) → the report on screen (COPY) + /admin → Reports from phones (BENCH). `&dpr=3` = the city at 3× for a look.
- C4d — THE CLOUD's NAMED SKIPS: a speed check the 2-core runner can never answer (A CALM LOAD STEPS NOTHING, BATTERY's frame counts) is
  `skipCI(what, why)` on CI — listed in the job's summary as `skipped` with its reason; `TIMING=strict` runs them anyway. THE DOCS' LINKS:
  `node scripts/check-doc-links.mjs` (+ `tests/doc-links.test.mjs` in the unit suite) — every `docs/….md(#anchor)` in the repo resolves (a
  pass's log: `docs/harbor/passes/<id>.md`). `pixdiff.mjs` shoots both sides AT REST (the title's `nd-idle`). On THIS Windows laptop
  (headless Chromium 149) the `perf` group's three BATTERY checks fail the same on older commits (no animation frame for 0.6 s after
  "visible again") — the cloud's Linux Chrome is the judge for them.
- HOTFIX Oct 29 — THE BASELINE GUARD (`ONLY=perf`; docs/harbor/passes/hotfix-oct29.md): the mean scene work a frame on a plain night, the
  forced bus at its stop + the forced dog walk (tier 0, `CPU`× throttle) divided by a fixed JS loop timed in the same page, FAILS above 2× the
  baseline in `tests/integration/perf-baseline.json` (CI without its own `ci` baseline: a warning from 2×, a failure from 4×). `PERF_GUARD=only
  ONLY=perf` = just the guard (≈ 1.5 min); `PERF_BASELINE=write` re-writes the baseline — only when a pass changes the cost ON PURPOSE (a CI
  run's numbers go into the file's `ci` by hand from its log). `title-perf.mjs --scenes bus,dog` (the owner's forced-bus link, the forced dog
  walk); `shots.mjs --scenes dogwalk,dogwalk-day --cast <ms>` (the dog's turn).
- THE MUSIC ON AN iPHONE (docs/audio.md#m2 / #m3 / #m4): `ONLY=music node e2e-harbor.mjs "<browser>" ./shots-harbor` (≈ 90 s, the emulators) — §6 the
  M2 scenarios (leave + come back, stuck, the music button, a network error, the OS pause, bfcache, a dead voice), §7 iOS's gesture rule
  emulated (play() / resume() refused outside touchend / click; a frozen clock → the direct element, the rebuild cap), §8 THE EVIDENCE
  (every new context's clock pinned at 0 while 'running' + `navigator.audioSession`: the direct element within ~2 s of one tap, one rebuild,
  the session 'playback' / 'ambient', back onto a voice once a clock runs); `node audio-resume.mjs "<browser>"` (City 1.0: an OS pause + one
  tap, the watchdog); `node e2e-lobbysong.mjs` (the room's song; its STUCK check fails since before M4 — docs/audio.md#m4 Known issues).
- MOOD MUSIC: `node --test tests/mood.test.mjs` (boundaries, the bag, the song file) and `node e2e-mood.mjs "<browser>"` (title, mood change at a song's end, CLASSIC, every preview mood, lobby sync + late joiner + host migration, a game's own music, the public board's first tap).

## THE RULES-LAG (FR6 FIXES A, Nov 4 — the standard: a feature never fails silently when the live rules are older than the code)
LOBBY 2.0 B changed `database.rules.json`; the live database kept the old rules until the owner re-published, and the show failed silently on
every real phone (23 client writes swallowed a refusal with `.catch(() => {})`). Three things now make that impossible to miss:
- **ONE WRITE PATH** (`js/firebase.js#write`): every `set` / `update` / `remove` / `push` / `runTransaction` returns the SDK's own promise
  UNCHANGED (callers keep their catch + fallback) and a PERMISSION_DENIED is reported once per path SHAPE a page (`js/core/rules-lag.js#pathShape`
  — ids masked: no room code, uid or match id) to /admin's errors, label `rules`: "RULES REFUSED update rooms/*/meta {go} — … re-publish".
  `firebase.js#refusals()` lists them (tests + &debug). A new feature on a NEW rule still needs a fallback that works on the old rules (2B's
  pattern: the start's stamp also rides in the match's own write) — the report says it happened; the fallback keeps the player's night.
- **THE RULES AS PUBLISHED** (`tests/fixtures/rules-live.json`, Nov 4 ~11:22 — 2B's rules): `tests/rules-live.test.mjs` (the unit suite) FAILS the
  moment `database.rules.json` differs from it, listing the changed paths, until `tests/fixtures/rules-live.ack.json` names the new rules' hash
  + the line `RULES CHANGED: <paths> — RE-PUBLISH …` — and that line is the FIRST line of the pass's summary (+ exactly how: Firebase console →
  Realtime Database → Rules → paste → Publish). When the owner confirms, the next pass copies `database.rules.json` over the fixture and
  deletes the ack.
- **`oldrules`** (the harbor `lobby` job, serial): the room on THE RULES AS PUBLISHED minus 2B's three nodes — the show still plays on both
  phones AND the refusal is reported (no room code in the report).

## THE LIVE-SITE GUARD + THE TEST FLAG (FR6 FIXES A — the owner, Nov 4: real "A ROOM JUST OPENED" pushes + five real member numbers from 2B's repros)
**Tests + repros run on the emulators — NEVER rooms, players or writes on neonspeakeasy.com** (the owner's standing rule since 2B; the memory
note "Ask before touching the live site").
- **THE GUARD** (`tests/integration/kit/live-guard.mjs`): every page a test browser opens goes through `guardUrl()` — `kit/puppeteer.mjs` patches
  `page.goto` on the page class (every page of every context of every script that launches through it: the harness, the harbor kit, shots,
  pixdiff, title-perf, the benches…); `wk-room.mjs` (Playwright WebKit) guards its own (`PROD=1` alone is refused). A non-local host
  (anything but localhost / 127.0.0.1 / [::1] / *.localhost / *.test) THROWS — unless `LIVE=1` is set on purpose. `scripts/lab-export.mjs`
  defaults to the LOCAL server (the owner's marks: `node scripts/lab-export.mjs https://www.neonspeakeasy.com` — a read). `tests/live-guard.test.mjs`
  checks the guard, the patch, the flag, and that no test or script DEFAULTS to the live site.
- **THE TEST FLAG** (`&test=1` — the guard adds it to every page under `LIVE=1`; `js/identity.js#testMode`, kept by the tab across reloads +
  the room URL): no profile is made (`me.js#syncMe` returns null → no MEMBER Nº for a throwaway player), and the room push says `silent` (the
  server marks the room, pushes nothing).
- **THE ROOM PUSH's own rules** (`api/_lib/radio.js#roomOpened` + `room.js#roomPushLater`): asked 10 s after the room opened and only while
  the phone is still in it; the server wants the room's host a player + online, once a room an hour, ONE per sender an hour + 10 an hour in all
  (`PUSH_LIMITS`, rl/ — the shared `api/_lib/limit.js#take`); the push opens `/?room=CODE` (a room closed by then: "That room has closed").
- **THE LOGS PRUNED ON WRITE** (`api/_lib/prune.js`): a log write prunes phonelog (the newest 40), errlog (quiet 30 days) + rl/ (older than
  2 days) at most once an hour.

## THE BUSY-PC CHECK (LOBBY 2.0 A — the owner, Nov 3 8:49 pm) — before EVERY full local test run
`node scripts/busy-pc.mjs [seconds=30] [--limit 30]` samples the machine's real CPU load (all cores) for ~30 s and names the busiest
processes (Windows). Quiet → carry on. BUSY (the average over the limit) → send Ben a push "Pause Grok — the full test run is next" and wait
for his go. An idle window (Grok open, doing nothing) doesn't count — it's the load that matters. A failure that only happened on a busy PC is a
load problem, not a flake to patch.

## LOBBY 2.0 A — the room in the city in the tests
- The harness (`kit/harness.mjs`), smoke, conn + presence wait for `.lobby-screen, .title-screen.is-room` (a City 2.0 room is the title in room
  mode); smoke reads the GAMES sheet's games. `e2e-chat.mjs` still drives City 1.0's lobby strip (B moves it).
- e2e-harbor's NEW `lobby` cloud job: `room` (two phones + a full room, ~2 min), `roomchat`, `keypop`, `roomperf` (the real compositor); the
  `billboard` group is in `show`. Fake players come straight into the emulator (`rooms/{CODE}/players` + `presence` — PATCH with the owner token).
- `tests/integration/profile-preview.html` — the REAL profile screen without Firebase (the look work).
- A local server started BEFORE an `/api` change serves the OLD functions (Node caches the modules) — run a fresh `serve.mjs <port> --emu`
  and point the suites at it with `E2E_BASE=http://localhost:<port>`.

## LOBBY FIXES (Nov 4) — the room's own jobs
`lobbyfix` (oneseat — three slots on one profile, playercard, leavewave, bannerfull, hostcard, newstart) + `lobbyfix2` (platefit — via
`tests/integration/plate-preview.html`, youpage, corners, arrivals, radiorest). The look run for the start + after the match:
`node tests/integration/room2-look.mjs "<browser>" ./shots-room2/ 390,402,430,1440`.

## THE SPEED PASS (Nov 4 evening) — green means green (review-6.md G)
- The `speed` cloud job: `staleroom` (out of the room: the figures walk off ringless, one toast, no stale host claim), `youcard` (the first
  painted card is the equipped one), `guestring` (WAITING / FOR HOST inside the ring at 390 / 402 / 430), `bannersky` (the banner's box above
  the skyline's tops after a match at 390 / 402 / 430 / 1440), `partyroom` (FR6 A7 — a preview link keeps `&when= &force= &lgnow=` in a room:
  a Saturday 22:15 party + the UFO + 8 in the lines + the guest list's 8 legendary strips; the speed half the mini PC's).
- G1 THE SPIDER'S TAP: `holiday.mjs#hubStill` waits for the HUB still (`mode still && far < 1 && calm && !trip`) — a roam pause is also
  `still` — and taps where that same check found it. G3: the sightings capture's `ms < 12` dropped (the frame gaps are the honest half).
- G4: the board-row seed was already in (LOBBY 2.0 A); THE VAULT's FULL LOBBY speed checks + the room's two speed checks are `skipCI` on the
  runner (no GPU path — they warned in every cloud run) with their RULE half hard (`vault.mjs#gpuCheck`); THE TAPE's WATCHDOG accepts either
  valid recovery (the reload, or the slice-end fallback — `tape-stop.js` counts `sliceEnds`).
- room2's FILE-IN: a condition (the host seen walking / through the door before the fade), not one sample.
- G8: the tail runs `panel` + `oldrules` SIDE BY SIDE (two child processes — oldrules swaps the rules, panel writes city2/live through /api:
  they never meet), then `perf` + `partyroom` alone (SERIAL — speed measurements). **SHARDS STAYS 4**: one measured SHARDS=6 run on the mini PC
  took 24 min (vs ~20 at 4), peaked at 20 GB of 32, and overloaded the machine — six timing reds + one CDP timeout, every one green alone.
- `lobby` / `room2` / `lobbyfix` SECONDS refreshed from LOBBY FIXES' cloud run's own per-group times (`harbor-jobs.mjs`).

## THE SPEED PASS B (Nov 4 night) — the new groups
- `speed` job: `fullcard` (the full card over CUSTOMIZE vs alone at 4× CPU, the real compositor + nothing moving behind it), `startglass` (no
  glass during the start + its frames, recorded), `musiccache` (E2 a + b), `rebuild` (A2: BACK TO THE ROOM → the city shown at 4× CPU, the long
  tasks; PROF=1 prints a profile), `resizekeep` (A6). `lobbyfix2` job: `leaver` (every DRAWN figure counted through the walk-off —
  `__district.drawnNow()`), `hostleave` (three slots), `twotabs` (two pages of one slot: one director, one song — headless puts the first page
  in the background when the second opens, so the visible one plays). e2e-conn: E3's `/api/time` count. Unit: `tests/speed-b.test.mjs`.
- `harbor-jobs.mjs`: the speed rows' seconds were inside a comment (so the cap check never saw them) — out now; the job split to stay < 10 min.
- `tests/integration/bytes-probe.mjs` — a fresh visit's bytes (music / the rest) in its first 25 s.

- **LOAD FIX 4 (Nov 10) — GROK'S BOOT AUDIT:** the harbor `load` group's **THE REJOIN LIMIT** (a refresh in a room with the database line dead
  → the city + REJOIN in ≤ ~10 s, no reload; the line back → into the room by itself / by REJOIN) + THE BOOT SAFETY NET's **a core sheet failed
  TWICE**. WebKit, each through THE LINE, on the emulators: `node tests/integration/wk-skew.mjs [--only a,b-radio,b-host,b-game,c] [--out DIR]`
  (THE DEPLOY SKEW — starts its own deploy A :5176 / deploy B :5177 servers (`VERCEL_GIT_COMMIT_SHA`), the line's `switchOn` + `rules` = deploy
  B's new export; `SKEW_ROOT=<tree>` serves another tree — the BEFORE run) · `node tests/integration/wk-hidden.mjs [--hides 5000,30000] [--runs 2]
  [--plain 3]` (THE HIDDEN BOOT — the page hidden mid-bake: revealed 'ready' after the return, no change after) · `node tests/integration/sw-cache.mjs`
  (the service worker: warm loads write nothing, no per-query copies, offline still loads — its counts on `postMessage('ns:sw-stats')`). Unit:
  `tests/lazy-import.test.mjs` (no stray dynamic import), `tests/onscreen.test.mjs` (the gates on the on-screen clock), `safari-floor.test.mjs`
  (no lookbehind / static block / import attributes / regex v flag + the filter's corpus), `boot-watchdog.test.mjs` (#10 #11 #12).
- **LOAD FIX 3 (Nov 10) — THE FREEZE LOOP:** `node tests/integration/wk-freeze.mjs [--runs 30] [--cpu 3] [--rtt 40] [--mbps 40] [--sw]
  [--drop 0.02] [--fail RE] [--stall RE --stall-n 1] [--mangle RE --mangle-from A --mangle-to B] [--x-fail RE] [--x-stall RE] [--junk V] [--skew
  --upstream A --skew-to B] [--live] [--out DIR] [--json f]` — WebKit 402×874 @3, a cold + a warm load a run through THE LINE
  (`kit/line-proxy.mjs`: Vercel's ETag caching, a phone's line + the faults, the deploy switch), each timed to the reveal (the city shown AND the
  boot screen lifting) + the first tap (BOARD); a freeze saved with its stage. **THE MUSIC ON THE TAP:** `node tests/integration/tap-music.mjs
  [--engine chromium] [--net wifi] [--scene night|day] [--hold 18] [--notap 60 --cap 1024]` — the first tap → the station's music sounding (no voice
  before a tap); HE4: `--hold` = that many seconds after it sampled (no silent sample — the warm slice hands over to the whole song), `--notap N` = NO
  tap: the music bytes fetched in N s (each request + its Range; fails above `--cap` KB). **THE CARD
  STILLS:** `node scripts/build-card-stills.mjs "<browser>"` (`--check`).
- **LOAD FIX 2 (Nov 9) — THE BOOT CLOCK:** `node tests/integration/boot-time.mjs "<browser>" [--runs 3] [--cpu 4] [--net wifi|4g|3g] [--warm]
  [--trace] [--log] [--tap 0] [--json out]` — Chromium (CDP throttles): the boot screen, THE REVEAL, a tap on BOARD at the reveal → THE BOARD,
  the requests + bytes before the reveal by kind (+ the service worker's own fetches warm), the long tasks before (`--trace`: their pieces) and
  in the 2.5 s after it. `E2E_BASE=http://localhost:5174` = a worktree (A/B). `LIVE=1 … --live --base https://neonspeakeasy.com --tap 0` = a
  READ-ONLY timing of the live site (&test=1). **THE CLOUD SNAP:** `node tests/integration/sky-snap.mjs "<browser>" [--case late,late-rain,
  stale,stale-rain,nearstale,twice,clock|all] [--runs n] [--cpu 4] [--secs 8] [--log]` — the live path with the weather + the clock scripted,
  the clouds per frame after the reveal (`kit/load-probe.mjs#skyJudge`); exit 1 on a snap. **THE BOOT PRELOAD:** `node scripts/build-boot-preload.mjs`
  (`--check`) after a module's imports change — `tests/boot-preload.test.mjs` fails when index.html is stale; THE BOOT BUDGET:
  `tests/boot-budget.test.mjs` + the harbor `load` group (tests/integration/boot-budget.json).
- **LOAD FIX 5 (Nov 11) — NO TWO CAMERAS:** `node tests/integration/wk-double.mjs [--paths all|a,b] [--shots DIR] [--json out.json] [--log]`
  — Playwright's WebKit, 402 × 659 @3 (the owner's page between Safari's bars), his morning (Nov 11 8:30, fog); on the emulators +
  `serve.mjs --emu`; ~5 min for the 21 paths (`kit/two-cameras.mjs` lists them: `box-pre@N` = the owner's DOUBLED CITY — the city's box grows
  before the reveal with no window resize; `restore`, `bfcache`, `box-return`, `hours`, `hours-box`, `resize-hidden`, `wx-late`, `bars-*`,
  `resize-post`, `tier`, `no-observer-*` …). Each path: EVERY frame (`kit/load-probe.mjs#CAM_REC` + `camJudge`) + a PIXEL look at its steady
  moments (one copy of the billboard, EST. 1924, the blade) + one scene, one loop at the end; exit 1 on two cameras. The page's test
  controls (installed before it mounts): `__box(h)` = the city's box by a style (NO window resize), `__hide(on)` = a faked visibility,
  `__jump(ms)` = the clock (the path also shifts `/api/time`), `__page('pagehide' | 'pageshow', persisted)`. The same runner in the suite:
  **`ONLY=cameras`** (Chromium, 11 paths, three pages at a time — two on CI; ~85 s). `E2E_BASE=http://localhost:5174` = a worktree (the
  BEFORE run: 7 of 11 red on 13cd99a8). A NEW camera / box path = its `kind` in `kit/two-cameras.mjs#runPath` + its name in `ALL_PATHS`
  (+ the group's `WHAT` if the cloud should run it).
- **THE CORNER BUTTONS' 44 PT (HOLD'EM IN THE CITY — B2):** **`ONLY=tapfit`** (the lobby job, ~15 s): every corner button's REAL hit area —
  `kit/corner-probe.mjs` walks `elementFromPoint` out from each button's centre, a quarter point at a time — on the city, THE BOARD, PRISM DROP,
  OVERCLOCK + the dailies' previews at 390 + 1440; under 44 × 44 fails (the old 4 pt `::after` read 42 — an absolute box's inset counts from
  the padding box). A new screen with corner buttons = its preview in the group's `PAGES`.
- **THE LOAD FIX (Nov 6) — THE BOOT IN WEBKIT:** `node tests/integration/wk-load.mjs [--scene day|grey|night|all] [--bars pre|fade|after|late|none|all]
  [--safari] [--warm] [--fresh] [--size WxH] [--shots DIR] [--log] [--frames --json out.json] [--fonts-delay ms] [--sky-delay ms] [--live]` — the
  real boot in Playwright's WebKit as an iPhone (402×874 @3), Safari's bar = the window's height 874 → 800 → 874 at a moment of the load
  (`--safari` keeps the city's 100lvh at the large viewport, as Safari does); exit 1 on any of the four (THE DOUBLED LETTERING · THE CHUNKS ·
  THE #net PILL · THE STRAY SCREEN). The probe + judge are ONE file, `tests/integration/kit/load-probe.mjs` (also the harbor `load` group's
  four THE LOAD FIX checks); the scene's cheap per-frame read for it: `window.__district.loadProbe()`. On the emulators + serve.mjs --emu.

## PASSKEYS (FRIENDS B)
- `/api`: `node --test --test-name-pattern=PASSKEYS server.test.mjs` (in tests/integration) — `kit/soft-authenticator.mjs` makes real WebAuthn answers in
  Node (a P-256 key, CBOR, signatures; `uv: false` / `origin` / `counter` overrides for the bad cases). Rules: `rules.test.mjs` PASSKEYS.
- Browser: `e2e-profiles.mjs` step 6p adds Chromium's VIRTUAL AUTHENTICATOR over CDP (`WebAuthn.enable` + `addVirtualAuthenticator` — ctap2, internal,
  resident key, UV) → ADD → `Storage.clearDataForOrigin` (a new anonymous sign-in) → BRING YOUR CARD → SIGN IN → the same card → REMOVE. The RP ID is
  `localhost` — run the page on `http://localhost:5173` (never 127.0.0.1: an IP can't be an RP ID). WebKit: `wk-keychain.mjs` (Playwright's Windows
  WebKit has no `navigator.credentials` — an inert stand-in draws the buttons; the real Face ID = an iPhone).

## DFIX3 — the dailies' probes (Nov 8 2026)
- `tests/integration/daily-probe.mjs "<browser>" [./shots]` (E2E_BASE = the local server): saves SHARE TODAY's CANVAS itself (both states × both looks — what a
  phone would share, never the page round it) + measures THE DAILY SCREEN's real frame pacing at 1× / 4× CPU, dpr 2, both looks (the stamp-down + the foil).
- `tests/integration/admin-probe.mjs "<browser>" [./shots]` (the emulators up): makes an owner profile through /api, starts ITS OWN `serve.mjs 5179 --emu` with
  that profile in ADMIN_PIDS, restores the key in a browser (that browser's uid IS the owner), seeds a few plays, shoots /admin → THE DAILIES at a phone width
  + desktop, stops its server.
- `e2e-coastclear.mjs` now also proves COALESCED MOVES (six taps on a 150 ms line = 2 calls), the dev timing + Server-Timing, and THE FADE ON LEAVING's order
  (audio/engine.js — `simulateVisible`); `e2e-daily.mjs` THE ONE-TIME HINT (once; none on a resume) and YOUR FRAME on the strip.

## CITY FIXES (Nov 8 2026) — the lost taps + the billboard
- **THE LOST TAPS:** `node tests/integration/e2e-taps.mjs "<chromium>"` and `ENGINE=webkit node tests/integration/e2e-taps.mjs` (Playwright's WebKit,
  402×874 @3, touch) — on the emulators + `serve.mjs --emu`; `N=20` taps a control (YOU / BOARD 6, HOST 8, LOCK 10), each with a random
  disturbance at a random moment; THE TAP TABLE at the end (landed · lost · rescued); a tap that hit a still-moving sheet elsewhere is an
  AIM miss (the watch's `lastDown()` names what it pressed), never counted as lost. ≈ 6 min Chromium, ≈ 9 min WebKit.
- **THE FIRST TAP (Nov 13):** `node tests/integration/wk-docktap.mjs [--base URL] [--only title,room]` (Playwright's WebKit from `~/wk`, 402×874 @3,
  touch, THE RESCUE OFF; the emulators + `serve.mjs --emu`) — each title dock button (JOIN · BOARD · PLAY · YOU · HOST, + DAILY when live) in its
  own COLD load, ONE tap at the reveal → it opens; then the room dock (INVITE · PLAY · YOU · GUESTS · GAMES · CHAT) one tap each. ≈ 2 min.
- The board's rebuild count: `__district.boardXf().rev` (+ `show`). THE BLACK HELICOPTER's per-frame heading + its pass's frame rate: harbor `heli`.
- The HOLD'EM look: `shots.mjs --preview --city 2 --qs "force=billboard-holdem" --crop bill` (+ `&holdem=open`; the paste:
  `force=billboard-holdem,work-billposter&speed=20 --wait 34000`).

## FR7 FIXES B (Nov 12)
- **PASS SCREENSHOTS STAY ON THE PC** (D4): `.gitignore` keeps every picture under `docs/harbor/passes/`, `docs/games/`, `screenshots/` out of git —
  shoot into the pass's folder or `shots.mjs`'s default `./shots-review/` as before; a picture a doc must carry = a JPEG at 1×, ≤ 150 KB, `git add -f`,
  named in the pass log (`tests/repo-growth.test.mjs`).
- New scripts: `wk-edge.mjs` (THE EDGE CACHE's proof for THE LAUNCH — its checks fail on today's worker BY DESIGN until docs/launch.md step 8 ships; its counts are today's numbers — the requests a visit sends, cold / warm / after a deploy, WebKit through THE LINE with production's
  headers `prod` + a build id `build`; each visit a NEW TAB — WebKit's reload reuses its memory cache), `wk-twotabs.mjs` (THE TWO-TAB HANG — two pages
  on one context, a stuck store, a hung boot's TAP TO TRY AGAIN + "other tabs open"), `prism-nowebgl.mjs` (PRISM DROP with WebGL off, 390 / 402 / 430),
  `og-board-shot.mjs` (+ `scripts/seed-og-board.mjs` — /board's link preview from made-up rows), `scripts/deploy-size.mjs`.
- The smoke's `GAMES=` names only playable games (`overclock` · `prism` · `holdem`) — anything else stops red. THE LINE's upstream + every WebKit launcher
  go through THE LIVE-SITE GUARD. `e2e-profiles` first, on fresh emulators (its board-row check reads the first other row).

## THE DROP A (Nov 13 2026 — docs/prism.md "THE DROP")
- Unit: `tests/prism-drop.test.mjs` (the schedule, the guaranteed end, record → replay, checkpoint chains, every refusal, the phone ≡ the server
  for 12 seeds, the replay's cost) · `tests/prism-drop-judge.test.mjs` (the record on a fake clock: a whole run, a refresh, the pauses, the
  room's pause, too early, slow motion, resync, a tampered chunk, abandoned) · `board-points` (THE DROP's curve).
- `/api`: `node --test daily-drop.test.mjs` in tests/integration (its OWN file: it sets `DAILY_TEST_OFF=drop`, so the other suites' lists stay
  password · coastclear · test).
- E2E: `DAILY_TEST=1 DAILY_TEST_OFF=drop node scripts/serve.mjs 5173 --emu` then `node e2e-drop.mjs "<chromium>" ./shots-drop` (21 checks, ~40 s;
  shots at 390 × 650 / 402 × 690 / 430 × 746, the refresh + the end by day). Run e2e-daily against a server WITHOUT `DAILY_TEST_OFF` (it
  counts exactly three dailies — the fake third).
- `e2e-playnow.mjs --only lost` — THE LOST RUN (docs/profiles.md).
- THE ADD-ON (the cost check): `prism-drop-judge` asserts ≲ 30 uploads a run + no snapshot kept; `daily-drop.test` the request count, a forged
  log stored by a checkpoint + refused at the finish, THE PRUNE (the top 10 keep their logs, 7 days later none; every score row stays).

## THE RULES FROM CLAUDE.md (moved Nov 13)

THE CLAUDE.md DIET (FR7 FIXES C, Nov 13): CLAUDE.md keeps ONE line per rule with a pointer here; the full text it held for this area
is below, VERBATIM (as of `48e3e157`). New detail goes in the sections above, not back into CLAUDE.md.

### The doc table row

| `docs/testing.md` | running / writing tests: emulators, smoke test, each game's E2E and its env flags, previews, Lighthouse |

### NEVER THE LIVE SITE + THE RULES-LAG (FR6 FIXES A)

- **NEVER THE LIVE SITE (FR6 FIXES A):** tests + repros run on the emulators — `kit/live-guard.mjs` refuses a non-local page unless `LIVE=1` on purpose (then `&test=1`: no profile, no member Nº, a silent room push); docs/testing.md "THE LIVE-SITE GUARD".
- **THE RULES-LAG (FR6 FIXES A):** every database write goes through `firebase.js#write` (a refusal is reported to /admin, ids masked — never silent); a pass that changes `database.rules.json` fails `tests/rules-live.test.mjs` until its ack names the change, and its summary's FIRST line says RE-PUBLISH + how (docs/testing.md "THE RULES-LAG"); a feature on a new rule keeps a fallback that works on the old one.

### Look previews without Firebase

- **Look previews without Firebase:** `tests/integration/<id>-preview.html` mounts the REAL view with a scripted state through an import
  map that swaps `js/firebase.js` for `tests/integration/fake-firebase.js` (see gridlock-preview.html). Iterate screens there in
  seconds; run the E2E once the look is right.

### Working efficiently (as it stood)

## Working efficiently (what cost the most in past sessions)
- **Edits:** use the Edit tool or a script file in the scratchpad. Never put code with backticks, `$` or `\b` inside an inline
  `node -e "…"` / heredoc — the shell mangles it and the repair costs more than the edit.
- **Names:** a view's own `update(state)` shadows Firebase's `update` — import it as `dbUpdate` (RUMRUNNER lost its DONE writes to this; the
  failure was silent because the view's update() just returned).
- **Tests, in order:** `node --test tests/*.test.mjs` (seconds) → the game's `FAST=1` E2E (≈ 2 min) → the full suite once before
  committing. Don't re-run a 20-minute suite to check one fix. Run E2E suites with absolute paths and from `tests/integration`.
  The title + the city run in the HARBOR suite by group while iterating: `ONLY=core,dock,neon` (comma-separated; ~30–130 s a group);
  the whole suite once before the commit. Untouched areas need no E2E at all (a game → its own). (CITY 1.0 OUT retired e2e-title / e2e-sky.)
- **Look reviews:** `node tests/integration/shots.mjs "<browser>" --scenes night,day,halloween --sizes phones --crop dock` (scenes,
  size sets, Grand Rapids by default, crops of the dock / corner buttons / sign; `--cast <ms>` = every painted frame, the true frame
  burst for a flicker). Never write a one-off screenshot script again —
  add a scene or a crop preset to shots.mjs instead. "No look change" = `tests/integration/pixdiff.mjs` (A/B against a worktree on
  :5174, a noise floor); City 2.0's speed gate = `title-perf.mjs --ab` (a relative A/B in one run; absolute budgets are warnings).
- **Design rules that may conflict** (e.g. "visible at sunrise" vs "never over the letters" vs "a round arch" on a skyline with tall
  towers): check feasibility first — a few lines in node against the real numbers — and ask the owner which rule wins BEFORE
  building. Discovering the conflict through rounds of screenshots cost the most time of anything in Oct 2026.
- **Waits in tests:** wait for the actual condition (`waitFor(page, js)`), never a fixed sleep "to be safe"; a fixed pause only
  for something that is itself timed (a measurement window, a colour sampled mid-blend).
- **Line endings:** LF everywhere (`.gitattributes`); a CRLF working copy breaks exact-match edits.
- **A new game = rules first.** Pure `logic.js` + `director.js` with a whole-match simulation test before any pixel; then the view on the
  match kit; then one distinctive screen, reviewed at three sizes.
- Run `git status` before committing: stage the files of this task only (other work may be in the tree).

### Testing (the short version, as it stood)

## Testing (the short version; every suite and flag: `docs/testing.md`)
- **YOUR OWN SERVERS (the owner, FRIENDS B):** every pass starts its OWN fresh local servers (the emulators + `scripts/serve.mjs --emu`) — a server
  left from an earlier pass is stopped first (FRIENDS A's emulators were still up at FRIENDS B's start: "port taken") — and STOPS every server it
  started as its LAST step (the emulators' Java + node, serve.mjs, any preview); the summary says so.
- **THE BUILD MACHINE IS THE MINI PC** (the owner, Oct 30: "do more tests, do things locally"): a Beelink SER8, Windows 11, **32 GB**, Java (Temurin 21)
  → the emulators run HERE. Before EVERY final push run LOCALLY: the unit suite, the rules + `/api` tests, the smoke test (`GAMES=…` for a shared
  file) AND the FULL `e2e-harbor` suite (a City 2.0 pass) — the cloud run then CONFIRMS instead of discovers. Measured on it: unit ≈ 30 s (PERF-A's split), rules ≈ 27 s,
  smoke `GAMES=overclock` ≈ 30 s (an id that isn't playable stops RED — FR7 FIXES B), one harbor group ≈ 30–130 s, THE FULL HARBOR SUITE ≈ 33 min at 4 shards (~1,262 checks — FR7-A) (the default since PERF-A; PERF-B: the windows group 3 pages at a time — the shards end at ~690–890 s; ~800 checks; the machine's peak ~13 GB of 32 — models.md). **Run the full suite with nothing
  else busy** (no model bakes, no shot bursts beside it: under that load every group timed out "the harbor baked" — MODELS). Browser tests run
  OUTSIDE Claude Code's sandbox (its private AppData copy can't launch Chromium); THE GPU PIN (SHELL 2.0 B1): booted with no display, the kit pins the Radeon by its LUID — speed checks all red together → `node tests/integration/gpu-check.mjs "<browser>"` first (docs/testing.md); EVERY browser script imports puppeteer from
  `tests/integration/kit/puppeteer.mjs` (muted; on Windows software compositing — the TV runs at 29 Hz and headless Chromium followed it to ~30 fps): the local, uncommitted rule in `.claude/settings.local.json`
  (`node tests/integration/e2e-*`, `shots.mjs`, `title-perf.mjs`, `pixdiff.mjs` — run them from the repo root with those paths). Chromium:
  `C:\Users\benja\AppData\Local\ms-playwright\chromium-1248\chrome-win64\chrome.exe`. The laptop is retired (a backup).
- **GitHub checks** (unit → rules → /api → smoke, on the emulators) run **only on a pass's FINAL push** (SP6, the owner's CLOUD MINUTES, Oct 27):
  a game / app pass tags that push's commit **`[ci]`**, a City 2.0 pass **`[harbor]`** (which runs both workflows); pull requests + `gh workflow run tests`
  always run; every other push shows a skipped run (0 minutes) — run the unit suite locally before every push. Next to the Vercel deploy, never
  blocking it. Budget: ≈ 136 billed cloud minutes a pass while PUBLIC (FR7-A's count: tests ≈ 11, the harbor's 15 jobs ≈ 125); once PRIVATE only the tests workflow runs (THE PRIVATE-REPO WORKFLOW — docs/launch.md). Look at `gh run list` after pushing; a red ✗ is a broken main to fix first. Errors from real phones: `/admin`.
- **VERCEL DEPLOYS ONLY TAGGED PUSHES** (the owner's DEPLOYMENT STORAGE, Oct 27: Hobby's 10 GB went at ~300 MB a deploy on every push):
  `vercel.json#ignoreCommand` builds only when the push's **LAST commit message** carries **`[harbor]`**, **`[ci]`** or **`[deploy]`**
  (unlike the GitHub checks, which read every commit of the push) — so a pass makes ONE deployment: its FINAL push carries its tag (as above)
  ON THE TOP COMMIT; anything that must go live mid-pass (a hotfix, a docs-only fix the site shows) goes up with **`[deploy]`** (deploys, runs no
  cloud tests). Every other push shows "Canceled by Ignored Build Step" on Vercel — main stays live on the last tagged deploy.
  `.vercelignore` keeps everything no page or `/api` loads out of the deploy (docs, screenshots, tests, scripts, shots*, art) — a deploy ≈ 232 MiB since FR7 FIXES B (`node scripts/deploy-size.mjs`; the frozen games' songs left out),
  ~255 MB of it the music; a new top-level folder the site loads must NOT match it. Never write a tag in square brackets in a message that
  isn't meant to fire it (a message that NAMES the tags fires them all — write "the ci / harbor / deploy tags").
- **THE HARBOR IN THE CLOUD** (`.github/workflows/harbor.yml`, 15 parallel jobs — THE SPEED PASS added `speed`): the FULL `e2e-harbor` suite runs only on a pass's FINAL push
  (the harbor tag in a commit message — whatever the push touched, docs-only included: no path filter since FR6 FIXES A, `tests/workflows.test.mjs`) or `gh workflow run harbor` (`-f job=street`). **At most TWO cloud runs a pass**;
  never re-run to confirm a flake. A new test group: its `G()` in `tests/integration/harbor-e2e/<job>.mjs` + its name in exactly one job in
  `harbor-jobs.mjs`. Locally (the mini PC): the touched groups (`ONLY=…`) while working, the FULL suite once before the final push. Full text: docs/harbor.md.
- **THE DISPLAY CHECK (SHELL 2.0 B2 — no dummy HDMI plug):** a REAL-COMPOSITOR speed check asks `kit/puppeteer.mjs#displayAttached()` — no display
  → SKIPPED with "no display attached (a no-screen boot)", counted apart in the suite's last line (never a fail, never a silent pass); docs/testing.md.
- **THE BASELINE GUARD:** `ONLY=perf` fails above 2× `tests/integration/perf-baseline.json` (`PERF_GUARD=only` ≈ 1.5 min; `PERF_BASELINE=write`
  only when a pass changes the cost on purpose — say so). A cache keyed per frame must hold its whole working set.
- `node --test tests/*.test.mjs` — unit + whole-match simulations of all thirteen games (the ten hidden ones' quick tests kept), no deps, seconds (+ profiles/boards/XP: `profiles.test.mjs`).
- `/api` on the emulators: `node --test server.test.mjs` (in tests/integration); the whole profile flow: `node e2e-profiles.mjs "<browser>" ./shots-profiles`.
- Emulators (Java + Node): `cd tests/integration && npm install && npm run emulators`; rules: `node --test rules.test.mjs`;
  app: `node scripts/serve.mjs` → `http://localhost:5173/?emu` (`&slot=2`… for more players on one computer).
- **CONN — the database sockets:** `node e2e-conn.mjs "<browser path>" ./shots-conn` (≈ 1.5 min; `MEASURE=1` = the table only, `LINE=1` = each
  state's reasons): 0 sockets on a parked title, 1 in a room, 0 after QUIT + the grace — run it after touching room / boot / firebase.js.
- Smoke test first: `node e2e-smoke.mjs "<browser path>" ./shots` (two regular phones, the THREE PLAYABLE games started — HOLD'EM by a regular host, no owner gate — + a check that none of the ten hidden ones can start, no stray "null" — ≈ 30 s; `GAMES=cipher` = only those — the one-game check a City 2.0 pass runs after touching a shared file).
- Per game (WINDOWS: only PRISM DROP + OVERCLOCK + HOLD'EM run now — the ten hidden games' long E2Es stop until each comes back): `node e2e-<id>.mjs "<browser path>" ./shots-<id>` (env `N=8 SHOTS=0 GPU=1 CPU=4 PERF=0/1 FAST=1`); previews without Firebase:
  `tests/integration/<id>-preview.html`.
- RUMRUNNER's economy: `node scripts/sim-rum.mjs` (bot matches on the real rules, per length) before touching `js/games/rum/tuning.js`.
- Lighthouse (mobile): `npx lighthouse "http://localhost:5173/?emu" --form-factor=mobile --chrome-path="<browser>"` (targets 98–99 / 100 / 100 / 100).

## FR7 FIXES C2 (Nov 13) — the new commands
- `node tests/integration/wk-radio-faces.mjs [--base URL --root TREE] [--only plain,stale]` — WebKit as the owner: DESK → PROGRAM → LEDGER each paints its
  real content ≤ 3 s, plain + with a STALE `music.js` (its `musicFileOf` export taken away — the owner's phone). The shipped `be8c156c` fails the stale case.
- `node tests/integration/cr-double.mjs "<chromium>" --paths hours-dusk@16:40,… [--repeat N] [--shots DIR] [--diag JS]` — NO TWO CAMERAS paths in
  Chromium on their own (wk-double.mjs's twin); `--shots` keeps a red look's picture, its crisp-less twin and the PIXELS json.
  (Nov 13, the paint-order fix: `--cpu N` = CDP CPU throttle (the cloud ≈ 2); `--diag-all` prints EVERY look's match per crisp item — `s` at
  its best offset / `s00` at its own place: a crisp item that matches the city sits at s00 ≈ 4–11; ≈ 26 = a different picture over the city —
  + the marks and the first bad frames of a red run; `--shots-all` keeps every look; `hours-dusk@HH:MM:SS` sets the landing to the second.)
- `tests/now-playing.test.mjs` (NOW PLAYING imports nothing; the hub's order) · `tests/leafbank.test.mjs` (the ring's numbers).
- THE CLOUD's UNIT JOB has no root node_modules: a unit test never imports a file that reaches `api/_lib/fb.js` (firebase-admin) — check by running
  the unit suite once with `node_modules` renamed away.
- Known local flake (both trees, the harbor `cameras` group at three pages at a time): `no-observer-pre` red ~1 run in 3 ("fit … 85 ms after the
  reveal"); green alone 8/8.
