# Testing

Every test suite in detail: unit + simulation, emulators, the smoke test, each game's E2E and its flags, previews, Lighthouse.

## Testing
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
  - **Smoke test first (~2 min):** `node e2e-smoke.mjs "<browser path>" ./shots` — two REGULAR phone tabs (no `?slot=`; every
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
  - Title screen E2E: `node e2e-title.mjs "<browser path>" ./shots-title` (env `GPU=1` for real frame pacing, `SHOTS=0 VIDEO=0`) —
    first visit (gate → full power-on, audio unlocked by the tap, timing measured in the page), returning visit (short),
    same-session (instant), skip, reduced effects, HOST with a saved profile, JOIN by typing / paste / ?room= (with and
    without a profile), invalid code, I/O note, REJOIN, EDIT, showcase previews + HOW TO PLAY, tiers at 4× CPU, memory
    across title↔setup cycles, hidden-tab pause; screenshots at 390×844 / 412×915 / 1440×900 and MP4s of the first and
    returning intro (CDP screencast + ffmpeg from the PULSE venv). `title-shots.mjs` = quick sequence stills + the bare boot screen.
    The E2E suites open `?emu` pages, where the title skips its intro (add `&intro=1` to see it).
  - Lighthouse (mobile): `npx lighthouse "http://localhost:5173/?emu" --form-factor=mobile --chrome-path="<browser>"`
    (`scripts/serve.mjs` gzips like Vercel so the numbers are representative).

