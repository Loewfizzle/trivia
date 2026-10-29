# Testing

Every test suite in detail: unit + simulation, emulators, the smoke test, each game's E2E and its flags, previews, Lighthouse.

## Testing
- **GitHub checks** (`.github/workflows/tests.yml`, Oct 2026): **since SP6 (the owner's CLOUD MINUTES, Oct 27 — Pro's 3,000 a month went at
  ~400–600 a day when this ran on every push) only a pass's FINAL push runs it**: a push with **`[ci]`** (a game / app pass) or **`[harbor]`** (a City 2.0
  pass) in one of its commit messages; pull requests and `gh workflow run tests` always run; any other push shows a skipped run (0 minutes; it never
  cancels a full run in flight — a newer full run cancels an older one). The laptop runs `node --test tests/*.test.mjs` before every push. Budget
  ≈ 30–40 cloud minutes a pass (this workflow ≈ 10, the harbor's 7 jobs ≈ 25–30). It runs the unit tests,
  then the rules tests, the `/api` tests and the smoke test on the emulators with headless Chrome. They run **next to** the Vercel
  deploy, never in front of it; a failure is a red ✗ on the commit (and an email). (Since Oct 27 Vercel itself deploys only a push whose LAST
  commit carries `[harbor]`, `[ci]` or `[deploy]` — `vercel.json#ignoreCommand`, CLAUDE.md → Testing.) The smoke
  test's screenshots are attached to a failed run. Nothing there needs a secret. `gh run list` / `gh run watch` from the terminal.
- **THE HARBOR IN THE CLOUD** (`.github/workflows/harbor.yml`, Oct 24 — the laptop runs out of memory on the full suite): the WHOLE
  `e2e-harbor.mjs` (`SHOTS=0`, on the emulators) on GitHub's machines. **The rule (PART 8P, the owner's 2,000 monthly minutes — the repo is
  PRIVATE): it runs only on a pass's FINAL push** — a push with **`[harbor]`** in one of its commit messages (`CITY 2.0 PART 8P: … [harbor]`)
  that touches a City 2.0 file (the `paths:` list: `js/screens/harbor/`, `js/core/harbor-*` + `city-*`, the title, `js/audio/`, `audio/city/`,
  the harbor CSS, the suite + `harbor-jobs.mjs`…) — or by hand: `gh workflow run harbor` (Actions → harbor → Run workflow), `gh workflow run
  harbor -f job=street` for one job. A mid-pass push without the tag shows a SKIPPED harbor run (0 minutes) and never cancels a full run in
  flight; a newer full run cancels an older one. The quick `tests` workflow (unit, rules, `/api`, smoke) runs on the same `[harbor]` push (and on `[ci]`).
  - **4 parallel jobs** (the matrix `audio` · `show` · `city` · `street`; each job's groups in **`tests/integration/harbor-jobs.mjs`**,
    run in order in one process with `JOB=<name>` — the same command works locally): audio = music, flags, harbor, dock · show = neon,
    party, sky, life (FP3b: real doors + the dance circle) · city = core, skyline, water, load (FP3a: THE LOAD GATE — the reveal through two bar changes), then panel + perf (the
    two serial groups, last) · street = speakeasy, windows, sounds, people, motion (PEO: the people's motion — a 12-s rig trace of the afternoon + the dance circle); promenade sits in `city`. Each job has its own emulators + its own npm / emulator caches; a failed job attaches `harbor-results-<job>`. **A red job →
    "Re-run failed jobs"** re-runs that job alone (≈ 4 min), never the whole suite.
  - **A NEW GROUP** (`G('people', …)`) goes in exactly ONE job in `harbor-jobs.mjs` (the lightest by its `SECONDS` table) — until it does,
    `e2e-harbor.mjs` refuses to run (even with `ONLY=`) and `tests/harbor-jobs.test.mjs` fails in the quick workflow, so no group is ever
    skipped silently. A new JOB: a key in `CI_JOBS` + the same name in harbor.yml's matrix list + the Run-workflow options (the test checks).
    The laptop's no-ONLY run (`SHARDS=2|3`) spreads the same groups over its shards by `SECONDS` (`localShards`), then panel + perf.
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
    GitHub's 2-core machine is slower than the laptop: a timing check that passes here and fails there waits for its condition (never a
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
  (no emulators). The emulators need Java: if `java` is not on the PATH, the project's own JRE is at
  `~/.cache/neural-arcade/jre/jdk-21.0.12.1+1-jre/bin` (prepend it to PATH before `npm run emulators`).
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
    HTTP layer with real ID tokens); `node e2e-profiles.mjs "<browser>" ./shots-profiles` (the flow in browsers: automatic profiles,
    migration, emblems in the lobby, podium plaques + XP + RANK UP, an unreachable server's queued report delivered once, the key
    reminder, restore in a fresh browser, a new key retiring the old, THE BOARD with the pinned rank, opt-out, the public /board).
    Looks without a server: `board-preview.html` (`?mode=public&g=pulse&c=records&p=all&far=1&anon=1&empty=1&err=1`),
    `results-preview.html` (`?case=first|top10|world|pb|merged|rankup|legend`), `emblems-preview.html`; `og-board.html` renders the
    /board link preview (`render-assets.mjs` writes assets/og-board.jpg).
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
  - Stage 2 E2E: `node e2e-stage2.mjs "<browser path>" ./shots [signal|overclock|all]` (env `OC_FIRST=memory,stroop,…` puts
    those Overclock types first — its bots play all 20). Covers Last Signal (targeting,
    eliminations, host killed mid-battle, audio unlock / background pause / crossfades / victory track) and Overclock (every
    challenge UI, identical challenges on all clients, refresh mid-challenge), and writes every new screen at 390×844 and 412×915.
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
  - Overclock update 2: `node e2e-oc-2.mjs "<browser path>" ./shots` (N=8) — Missing Link typed (wrong guess shakes, plural, keyboard
    layout), Spellcheck, Make 24 (merges, UNDO, refresh between puzzles), Compass, Sort It with real touch swipes + side taps (host
    killed mid-challenge), Higher or Lower; identical puzzles everywhere, every player's points vs the scoring rule, all screens at both sizes.
  - PRISM DROP E2E: `node e2e-prism.mjs "<browser path>" ./shots-prism` (env N=8, RUSH=0, CPU=4; `PERF_ONLY=1 GPU=1 N=2`
    = frame pacing only) — 8 players: same song/world/7-bag on every phone, real CDP touch gestures (drag 3 cells, taps,
    soft drop, flick, swipe up, sideways swipes never hard-drop), bots battle, junk attacks, targeting, notes in key + clears
    on the 16th grid, refresh mid-battle, song change mid-match (world + crossfade), host killed, 30 s offline = out, Call
    the Winner, KO credit + badges, FINAL DUEL + music lift, game-night bonus, Score Rush (next playlist song, reboot,
    finale on the last beat, results), refresh after a KO, no stray "null" (41 checks). Scene preview without Firebase:
    `tests/integration/prism-preview.html?world=city&v=2&tier=1&bot=1&fx=1&danger=0.5`; worlds + per-tier timings:
    `node prism-shots.mjs "<browser>" ./shots-prism [cpu]` (measured with GPU=1 at 4× CPU: 16.7 ms median at all tiers).
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
  - Overclock new challenges: `node e2e-oc-new.mjs "<browser path>" ./shots` (N=8) — Lexicon/Timeline/Closest Call/Rewire played
    through the UI, identical puzzles on every phone, scoring vs the host's results, host killed mid-Timeline, refresh
    mid-Rewire, every new screen + reveal at 390×844 and 412×915.
  - Stage 3 E2E: `node e2e-8p.mjs "<browser path>" ./shots` — 8 players in 8 separate browser contexts play a full game of
    all four games, plus a late joiner, a rematch, the night scoreboard, an expired invite, the reconnect banner,
    every Neural Bluff screen at 390×844 and 412×915, and frame-pacing / long-task sampling (`shots/perf.json`).
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
    --sizes quick|phones|desktop|all|390x844,… --place gr|ny|none --crop dock,corner,sign|x,y,w,h --qs "…" --guest --out ./shots-review`
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
- THE MUSIC ON AN iPHONE (docs/audio.md#m2 / #m3 / #m4): `ONLY=music node e2e-harbor.mjs "<browser>" ./shots-harbor` (≈ 90 s, the emulators) — §6 the
  M2 scenarios (leave + come back, stuck, the music button, a network error, the OS pause, bfcache, a dead voice), §7 iOS's gesture rule
  emulated (play() / resume() refused outside touchend / click; a frozen clock → the direct element, the rebuild cap), §8 THE EVIDENCE
  (every new context's clock pinned at 0 while 'running' + `navigator.audioSession`: the direct element within ~2 s of one tap, one rebuild,
  the session 'playback' / 'ambient', back onto a voice once a clock runs); `node audio-resume.mjs "<browser>"` (City 1.0: an OS pause + one
  tap, the watchdog); `node e2e-lobbysong.mjs` (the room's song; its STUCK check fails since before M4 — docs/audio.md#m4 Known issues).
- MOOD MUSIC: `node --test tests/mood.test.mjs` (boundaries, the bag, the song file) and `node e2e-mood.mjs "<browser>"` (title, mood change at a song's end, CLASSIC, every preview mood, lobby sync + late joiner + host migration, a game's own music, the public board's first tap).
