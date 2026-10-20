# NEON SPEAKEASY — Roadmap

> The name lives in `APP_NAME` (`js/config.js`), plus `<title>`/meta in `index.html`, `manifest.webmanifest`, the logo
> (`js/ui/logo.js` → `scripts/build-boot-logo.mjs`) and the icons/preview (`tests/integration/render-assets.mjs`).
> It was NEURAL ARCADE until October 2026.

NEON SPEAKEASY — *your friends are already inside.* One web app, twelve games, 2–8 players, each on their own phone — same room or different cities.
A host creates a room (its HUSH WORD — a common 4-letter word), friends join, the host picks a game. After a match everyone
returns to the same lobby (or the host hits REMATCH) without anyone rejoining.

Hosted at **neonspeakeasy.com** (since Oct 2026; games.loewfizzle.com and trivia.loewfizzle.com permanently redirect here) (Vercel, static, deployed from GitHub `Loewfizzle/trivia`).
Backend: Firebase Realtime Database + Anonymous Auth, and four Vercel serverless functions (`/api`, firebase-admin) for profiles,
server-verified results and THE BOARD.

## The games — all twelve are playable

| # | Game | Style | Identity | Status |
|---|------|-------|----------|--------|
| 12 | **RUMRUNNER** | Prohibition trading (a modern Drug Wars): everyone in the same neon city, day by day — buy contraband cheap in one district, sell high in another, dodge the feds, pay off Mr. Vale, tip off rivals; a shared market, weather, upgrades, the stash; a 3D diorama city; the end-of-game front page of THE NEON GAZETTE. 15 / 20 / 30 days. | deco gold and burgundy, a city of neon in the rain | ✅ Stage 14 |
| 11 | **HIGH STAKES** | Wager trivia in the high-roller back room: see only the category and difficulty, bet chips in secret, then answer. MEDIUM pays 1×, HARD 2×, DOUBLE DOWN doubles it; house loans that come off your total; an ALL IN final revealed last place to first. | emerald felt and gold under a single lamp | ✅ Stage 13 |
| 1 | **CIPHER BREACH** | Competitive Wordle race; opponents' boards live as color-only tiles; word length grows. | terminal green / cyan | ✅ Stage 1 |
| 2 | **NEURAL BLUFF** | Bluffing trivia: write a convincing lie, find the truth among everyone's lies, score for fooling friends. 356 hand-written strange-but-true questions. | cold "Ministry of Truth" dossiers | ✅ Stage 3 |
| 3 | **LAST SIGNAL** | Trivia battle royale: HP + shields, strike your target, escalating damage, decaying UI. | alarm red | ✅ Stage 2 |
| 4 | **OVERCLOCK** | Twenty kinds of 30-second mind challenges (Lexicon, Timeline, Closest Call, Rewire, then Missing Link, Spellcheck, Make 24, Compass, Sort It and Higher or Lower added after launch), identical for everyone from a shared seed; no type repeats within a match and categories never come back to back. | amber / magenta | ✅ Stage 2 |
| 5 | **PULSE** | Multiplayer rhythm game: a neon highway through a procedural night city, beat maps generated from the owner's songs, synced start on server time, per-device calibration, Echo memory bonus rounds. | electric violet / cyan | ✅ Stage 4 |
| 6 | **NEON PAR** | Multiplayer mini golf: everyone plays the same hole at once with ghost balls; nine holes over three zones (Rooftops, Cyberspace, Neon Arcade); custom 120 Hz physics, power-ups, sabotage, ACE replays, ball customization. three.js. | teal turf glow / hot pink | ✅ Stage 5 |
| 8 | **PRISM DROP** | Falling-block battle set to music: BATTLE (junk attacks, KO badges, final duel, call the winner, sudden death) or SCORE RUSH (one song, highest score). Identical pieces for everyone, every phone runs its own board; WebGL worlds per song; sound effects in the song's key, on its beat. | luminous prism: white light, spectral edges, jewel glass | ✅ Stage 8 |
| 10 | **GRIDLOCK** | Fleet battle on a holographic war table: hide your fleet, call your shots. CLASSIC (turns, 2–4) or BATTLE ROYALE (everyone fires at once, 4–8, TARGET LOCK warnings, a bounty on the leader). SALVO (one shot per ship afloat) and ARCADE (ability cards: sonar, cluster, torpedo, EMP shield, relocate, double tap). Private fleets, public hits, cinematic volleys on a flat holographic board (Canvas 2D). | tactical steel-blue, signal-orange fire | ✅ Stages 11–12 (complete) |
| 9 | **SLIPSTREAM** | Multiplayer survival ride: everyone on the same seeded course at once, one thumb (hold = dive, release = fly, tap = flip), clean landings boost, hazards ramp up (gaps, laser gates, low ceilings, crumbling ground, gravity flips, boost rings), lives + rewinds, LAST RIDERS, sudden death; ghosts, five biomes with adaptive music. | sunset gold into deep blue; a single line of light | ✅ Stage 10 |
| 7 | **DOUBLE AGENT** | Social deduction for 4–8: everyone gets the same secret word except the double agent(s); one-word clues in turn, a debate (chat, or out loud in SAME ROOM mode), a vote, a dramatic unmasking and a last chance to steal the round by naming the word. 41 categories × 15–18 words. | corrupted surveillance feed: graphite / silver, player colours only | ✅ Stage 7 |

## Shipped

The detail (checklists, test counts) is in `docs/roadmap-history.md`; add a one-line entry here and the detail there.

- ✅ Stage 1 — foundation, lobby, multiplayer core, CIPHER BREACH
- ✅ Stage 2 — audio, LAST SIGNAL, OVERCLOCK
- ✅ Stage 3 — NEURAL BLUFF + final polish
- ✅ Stage 4 — PULSE (multiplayer rhythm game)
- ✅ Stage 5 — NEON PAR (multiplayer mini golf)
- ✅ Stage 6 — Room chat
- ✅ Overclock update — four new challenges, no repeats
- ✅ Overclock update 2 — six more challenges, category spread
- ✅ Idle rooms close
- ✅ Stage 7 — DOUBLE AGENT (social deduction)
- ✅ Stage 8 — PRISM DROP (falling-block battle, the showpiece)
- ✅ Stage 9 — NEON DISTRICT (rebrand + the front door)
- ✅ Stage 10 — SLIPSTREAM (survival ride)
- ✅ NEON SPEAKEASY (rename + menus in the title's language)
- ✅ Stage 11 — GRIDLOCK, Part 1 (fleet battle: core + CLASSIC + BATTLE ROYALE)
- ✅ The match kit + the docs split (Oct 2026)
- ✅ GRIDLOCK presentation rebuild — flat (Oct 2026)
- ✅ Stage 12 — GRIDLOCK, Part 2 (SALVO + ARCADE) (Oct 2026)
- ✅ LIVING CITY (Oct 2026)
- ✅ MOOD MUSIC (Oct 2026)
- ✅ THE FLANK + the title's corner buttons + the lobby song (Oct 20, 2026)
- ✅ Phones: THE BIG ARCH in step with the real sky (Oct 20, 2026)
- ✅ Phones: THE SUN'S BIG ARCH (Oct 20, 2026)
- ✅ HUSH WORDS (Oct 19, 2026)
- ✅ THE NEON COMES ALIVE (Oct 19, 2026)
- ✅ Mobile skyline + the sun's low arc (Oct 19, 2026)
- ✅ THE NEON RING — the title's dock (Oct 19, 2026)
- ✅ THE REAL SUN (Oct 19, 2026)
- ✅ AIR TRAFFIC + SATELLITES (Oct 19, 2026)
- ✅ LIVE WEATHER + the city's life (Oct 19, 2026)
- ✅ Safety net (Oct 19, 2026) — from the project review's top items (`docs/testing.md`, `docs/profiles.md`, `docs/audio.md`)
- ✅ Stage 14 — RUMRUNNER (Prohibition trading, the city diorama) (Oct 2026)
- ✅ Stage 13 — HIGH STAKES (wager trivia, the signature room) (Oct 2026)
- ✅ Profiles, THE BOARD and SPEAKEASY RANKS (Oct 2026)

## Next up (agreed plan, in order)

- **First-visit speed:** TAP TO ENTER appears ~2.2 s after navigation on a cold start (target 1.5 s). The modules are loaded
  by ~0.35 s and the gate built by ~0.6 s; the first frame after that is blocked ~1.6 s (the city's first build or the sky
  shader compiling — profile it). Warm: 0.6 s. e2e-title guards it at 2.6 s.
1. ✅ **Smoke test on a normal phone tab** (`tests/integration/e2e-smoke.mjs`, done). The E2E suites only use `?slot=` test tabs, which hid the lobby "null" bug. A ~1-minute
   test: plain tab (slot 1), lobby, one round of each game, and fail on any visible "null"/"undefined" text.
2. ✅ **Split `js/games/overclock/view.js`** (was ~1,600 lines) into `ui/<type>.js` (one per challenge), `reveals.js`, `shared.js`;
   view.js is now the ~450-line shell (done).
3. ✅ **Overclock QUICK mode: 6 challenges** (≈ 3 min) next to Standard 12 / Marathon 24; the modes are now a list with a
   sub-line, like Neon Par's course picker (done).
4. ✅ **New game: imposter word game** — shipped as **DOUBLE AGENT** (Stage 7 above).

## Future ideas
- **The city shows the real crowd** (LIVING CITY, agreed Oct 19 2026 — wait until there are enough players that it looks full,
  not empty): a lit window per player in a room right now, a rooftop neon "37 INSIDE", searchlights that switch on when it's really
  busy — the tagline made literal. Needs a tiny public, cached count (admin STATS already computes it: `insights.js#liveRooms`).
- **Holiday music moods** (not built): a Halloween-night mood, Christmas music through December's build-up, NYE party — the same
  system as MOOD MUSIC (data/mood-music.json gains holiday lists; core/sky.js already knows the holidays and their build-ups).
- **New game: drawing telephone** (like Gartic Phone / Telestrations; 4–8 players, works with 3; no voice needed).
  Everyone types a secret prompt → the next player draws it on their phone (finger canvas: a few colours, 2 brush sizes,
  undo/clear, ~60–90 s) → the next sees only the drawing and types a guess → draw ↔ guess alternate until every chain has gone
  around → the reveal plays each chain step by step for everyone (drawings replayed stroke by stroke). Everyone works at once
  in every phase; drawings stored as strokes (tiny); server-clock timers; an offline player's step becomes "(ran out of ink)".
  Optional tap-voted awards ("Best drawing", "Most lost in translation") and a shareable image of the funniest chain.
  ~10–15 min a game — pairs well with DOUBLE AGENT (quick suspicion vs. slower laughs).
- **SLIPSTREAM:** more songs (drop slip9.mp3… in Downloads — see CLAUDE.md), a daily seed with a room leaderboard, more
  hazards (wind gusts, moving platforms), ghost replays of the winning run, more ride looks.
- **PRISM DROP:** more songs (drop prism6.mp3… in Downloads — see CLAUDE.md), more worlds, a solo marathon / daily seed,
  2v2 team battle, replays of the best clear.
- **NEON PAR:** more holes / a fourth zone (the format is data-only — see CLAUDE.md "Adding a hole"), a hole editor,
  daily challenge hole with a room leaderboard, replays of everyone's best shot at the end.
- **More content:** a question-pack format for Neural Bluff (themed packs: 90s, science, local in-jokes) and a host
  option to pick packs; custom word lists for Cipher Breach (kids mode, themed words).
- **Custom rooms:** host-written Bluff questions typed in before a party ("office edition").
- **More Overclock challenges:** ~~Stroop, reaction time, quick count, true/false, Lexicon, Timeline, Closest Call, Rewire, Missing Link,
  Spellcheck, Make 24, Compass, Sort It, Higher or Lower~~ (shipped); next: missing letter, spot the
  change, end-of-match awards ("Fastest Fingers"…), a final-round wager, streak bonuses (Quick 6 mode: see Next up).
- **Team modes:** 2v2 / 4v4 variants of Last Signal and Overclock.
- **TV / big-screen mode** (discussed Oct 2026, not started): a read-only "board" view on the TV while phones stay controllers.
  - How: `?room=CODE&tv` (plus a short `/tv` page where you type only the room code — typing URLs with a TV remote is painful).
    Joins as a watcher: never a participant, never host, never waited on; only *reads* the room (every screen already
    renders from DB state, so it's new landscape views of existing data). No rules changes; room chat would not show (members-only).
  - Shows: lobby with a giant room code + QR to join; per game the shared drama (Overclock progress race + reveals, Last Signal
    HP arena, Bluff lies + the reveal, Cipher boards side by side, PULSE leaderboard, Neon Par whole-hole view + ACE replay).
    Phones keep private controls; PULSE's highway stays on phones (timing). Optionally music/big moments play from the TV.
  - Getting it on a TV: Apple TV has no browser → AirPlay from a Mac (best, "separate display") or a spare iPad in landscape.
    Built-in browsers: Samsung and LG yes, Fire TV via Silk; Google TV / Roku / Vizio mostly no (cast a Chrome tab instead).
    TV browsers are slow: keep the board light, Neon Par's 3D as an optional upgrade with a 2D fallback.
  - Build order: lobby + Overclock first, then Bluff and Last Signal, then the rest. A native tvOS app is out of scope.
- **Profiles:** ~~persistent stats across nights~~ (shipped without any sign-in: see Profiles, THE BOARD and SPEAKEASY RANKS);
  next: achievements, seasonal boards, a friends-only board for a regular group, profile pages for other players.
- **Localization:** Spanish/French/German UI and question banks.
- **Haptics on iOS:** not possible from the web today; revisit if Safari adds an API.
- **Moderation:** a host button to hide an offensive Bluff lie before voting.
- **Analytics:** lightweight, privacy-respecting play counts per game to see what the group loves.
