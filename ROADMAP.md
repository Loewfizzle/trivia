# NEURAL ARCADE — Roadmap

> Working title. The name lives in one constant: `APP_NAME` in `js/config.js` (also update `<title>`/meta in `index.html`,
> `manifest.webmanifest`, and re-render the preview image with `tests/integration/render-assets.mjs`).

One web app, six games, 2–8 players, each on their own phone — same room or different cities.
A host creates a room (4-letter code), friends join, the host picks a game. After a match everyone
returns to the same lobby (or the host hits REMATCH) without anyone rejoining.

Hosted at **trivia.loewfizzle.com** (Vercel, static, deployed from GitHub `Loewfizzle/trivia`).
Backend: Firebase Realtime Database + Anonymous Auth.

## The games — all six are playable

| # | Game | Style | Identity | Status |
|---|------|-------|----------|--------|
| 1 | **CIPHER BREACH** | Competitive Wordle race; opponents' boards live as color-only tiles; word length grows. | terminal green / cyan | ✅ Stage 1 |
| 2 | **NEURAL BLUFF** | Bluffing trivia: write a convincing lie, find the truth among everyone's lies, score for fooling friends. 356 hand-written strange-but-true questions. | cold "Ministry of Truth" dossiers | ✅ Stage 3 |
| 3 | **LAST SIGNAL** | Trivia battle royale: HP + shields, strike your target, escalating damage, decaying UI. | alarm red | ✅ Stage 2 |
| 4 | **OVERCLOCK** | Twenty kinds of 30-second mind challenges (Lexicon, Timeline, Closest Call, Rewire, then Missing Link, Spellcheck, Make 24, Compass, Sort It and Higher or Lower added after launch), identical for everyone from a shared seed; no type repeats within a match and categories never come back to back. | amber / magenta | ✅ Stage 2 |
| 5 | **PULSE** | Multiplayer rhythm game: a neon highway through a procedural night city, beat maps generated from the owner's songs, synced start on server time, per-device calibration, Echo memory bonus rounds. | electric violet / cyan | ✅ Stage 4 |
| 6 | **NEON PAR** | Multiplayer mini golf: everyone plays the same hole at once with ghost balls; nine holes over three zones (Rooftops, Cyberspace, Neon Arcade); custom 120 Hz physics, power-ups, sabotage, ACE replays, ball customization. three.js. | teal turf glow / hot pink | ✅ Stage 5 |

## Stages

### ✅ Stage 1 — foundation, lobby, multiplayer core, CIPHER BREACH
Static no-build site, design system, rooms + invite links, presence, rejoin, host migration, server-time timers,
wake lock, stale-room cleanup, multi-tab testing slots, Cipher Breach, open-licensed word lists, security rules, tests.

### ✅ Stage 2 — audio, LAST SIGNAL, OVERCLOCK
Web Audio engine (iOS unlock, background pause, crossfades, seamless loops), six music tracks, synthesized SFX,
settings sheet, trivia layer (Open Trivia DB → The Trivia API → 333-question fallback bank), Last Signal, Overclock.

### ✅ Stage 3 — NEURAL BLUFF + final polish
- [x] Neural Bluff: 356-question strange-but-true bank (answers, accepted variants, 3 house lies each); WRITE (60 s)
      with a gentle "too close to the truth" check and iOS-keyboard-aware layout; VOTE (30 s) with merged duplicate
      lies, house-lie padding (≥5 options under 4 players), no voting for your own lie, one ♥ like; dramatic
      time-synced reveal (who fell for it → redaction lifts → whose lie → TRUTH VERIFIED → tally); 1000 / 500 / 100
      scoring, triple-points final round; Short (5) and Standard (8) modes; no repeated questions within a room
- [x] Game-night scoreboard across all games in a room (3/2/1 points per podium, crown for the leader)
- [x] REMATCH (same game, same settings) and BACK TO LOBBY on every results screen
- [x] Late joiners watch as spectators and are dealt into the next game automatically
- [x] Installable app: manifest, icon set (incl. maskable + apple-touch), standalone, network-first service worker
      that never caches Firebase and always serves the newest version when online
- [x] Link previews: Open Graph / Twitter tags + a 1200×630 preview card
- [x] Connection UX: reconnecting / restored banner, friendly errors for bad codes, expired invites and full rooms
- [x] Boot screen inline in the HTML (no flash of unstyled content), fonts load without blocking
- [x] Accessibility/contrast fixes; Lighthouse mobile: **99 performance / 100 accessibility / 100 best practices / 100 SEO**
      (Firebase SDK loads dynamically, stylesheets are non-blocking, music downloads only after the first tap)
- [x] 8 players in 8 separate browser contexts played a full game of all four games end to end; 55–60 fps with
      8 players' live updates
- [x] Consistency pass across every screen

### ✅ Stage 4 — PULSE (multiplayer rhythm game)
- [x] Song pipeline (`scripts/build-beatmaps.py`): trim/fade/mono re-encode, beat grid searched to 0.005 BPM and
      verified against synthetic ground truth (< 1 ms), drum-aware notes on quarter/eighth slots, 3 difficulties,
      musical lane assignment, energy curve, manifest; 5 songs processed
- [x] Timing engine on the Web Audio output clock; PERFECT/GREAT/GOOD/MISS ±45/90/135 ms, strays, combo ×1–×4, chords
- [x] First-run calibration (tap along) + Recalibrate in settings + "audio device changed" hint
- [x] Canvas night drive: 3D wet-road highway, procedural parallax skyline, haze, rain, bokeh, music-reactive city,
      hit flares, streak lights, milestone surges; automatic quality tiers; 60 fps on a 4× throttled CPU
- [x] Synced multiplayer start (server time), local judging, throttled live leaderboard, mid-song rejoin/resume
- [x] Echo bonus rounds (3 per song, growing patterns), song intro card + beat-synced countdown, standings,
      podium with accuracy / max combo / judgment counts, game-night points, rematch
- [x] Host options: song (or Random), 1–2 songs, difficulty for everyone, Echo on/off; PULSE card art; hit-sound toggle

### ✅ Stage 5 — NEON PAR (multiplayer mini golf)
- [x] Custom 2D physics (`physics.js`): fixed 120 Hz steps, swept circle-vs-segment collision (no tunnelling at full
      power, any angle, thin walls, moving bars), rolling friction per surface, slopes/ramps, boost strips, bumpers
      that kick, portals, gaps you jump (or fall into), lasers/spinners/gates/blinking tiles/moving platforms driven
      by server time, cup capture with lip-outs; unit-tested
- [x] Nine data-only holes in three zones (pars 2·3·3 / 3·3·3 / 3·3·4 = 27), Full 9 / Quick 6 / Quick 3; a validation
      bot proves each is finishable at/under par and measures ace odds
- [x] three.js renderer: height-following floors, instanced neon walls, emissive glow + sprites (no post-processing),
      blob shadows, env-mapped chrome/glass/wet; ROOFTOPS (wet concrete + neon puddles, rain, props, city + traffic
      far below), CYBERSPACE (Tron grid void, data particles), NEON ARCADE (chrome cabinet, pulsing playfield inserts,
      chasing bulbs); quality tiers; geometry disposed per hole
- [x] Slingshot aiming (dotted ground line, power ring, drag-back cancel), follow camera, pan/pinch, zone title cards,
      flyover + par card, out-of-bounds respawn effect
- [x] Everyone simulates their own ball; ghosts replay each other's real shots locally (corrected by 10 Hz samples):
      smooth with 8 players whatever the network; exact re-simulation on refresh mid-roll; host migration mid-hole
- [x] Power-ups (GHOST / STICKY / MAGNET), sabotage (FOG / WOBBLE / SHAKE, earned by birdie or best score), ACE
      cinematic on every phone, birdie/eagle celebrations, 30 s countdown once half are in, golf scorecard, podium with
      aces + best hole, game-night points, rematch
- [x] Ball customization (8 colours × neon/chrome/glass × ribbon/sparks/pixels trails), from the lobby or in game
- [x] Three zone music tracks (crossfaded), synthesized putt / bounce / cup / portal / boost / bumper / pickup /
      sabotage / respawn / ACE sounds, light haptics

### ✅ Stage 6 — Room chat
- [x] Free-text chat for the whole room session (no presets/emoji reactions/GIFs/read receipts): a compact lobby strip
      that opens a full chat sheet; in games a chat button under the gear with an unread badge
- [x] Open in the lobby and every break; locked (quiet lock icon, badge still counting, no sound/toasts) during your own
      active play in all six games; spectators and eliminated / finished players can always chat
- [x] Names in player colour, grouped lines, own lines styled apart, relative times, typing indicators (onDisconnect +
      4 s idle), unread badge per device, "New messages" pill, 300-char limit with counter, quiet system lines (joined,
      left, signal lost, reconnected, removed, new host, game started, winner)
- [x] Host: Filter language (whole-word profanity masking at render time, default off) and Clear chat; last 100 kept
- [x] Rules: members only (kicked lose access at once), own messages, server time, ≤ 300 chars, 800 ms rate limit; offline
      sends queue and deliver, rejected ones show tap-to-retry; keyboard-aware sheet (visualViewport), swipe to close
- [x] Chat code loads lazily and lives outside the app store — no effect on game frame pacing or first paint

### ✅ Overclock update — four new challenges, no repeats
- [x] LEXICON (9 letters, longest word counts; every set has a 7–8 letter word — 320 sets precomputed from the Cipher dictionary sources)
- [x] TIMELINE (tap-to-order 4 items, partial credit per position; 190 sets from 18 verified fact pools with fairness gaps)
- [x] CLOSEST CALL (keypad estimate, smooth relative-error curve, +60 to the closest; 175 questions; animated number-line reveal)
- [x] REWIRE (rotate pipes 3×3 then 4×4, BFS power flow, solvable + scrambled by construction, refresh-safe)
- [x] Selection: Standard = 12 different types of 14 (no Trivia weighting), Marathon = each type ≤ 2, never adjacent, spread out
- [x] Reveal panels above the leaderboard (10 s standings for Lexicon/Timeline/Closest Call)
- [x] Rules: `w/o/g/rw` fields; E2E `tests/integration/e2e-oc-new.mjs` (8 players, host killed mid-challenge, refresh mid-Rewire)

### ✅ Overclock update 2 — six more challenges, category spread
- [x] MISSING LINK (three clues, one hidden word; typed answer with letter boxes, plurals/variants accepted, iOS-keyboard layout; 283 puzzles)
- [x] SPELLCHECK (four spellings, one right, five words; 434 American-spelling words, every wrong option dictionary-checked)
- [x] MAKE 24 (merge tiles with + − × ÷, exact fractions, UNDO/RESET; 209 easy + 47 hard sets, all proven solvable)
- [x] COMPASS (follow 3 → 7 turns in your head, tap the heading; animated replay of every round in the reveal)
- [x] SORT IT (swipe cards with tilt/fling physics or tap a side, cards speed up; 48 category pairs)
- [x] HIGHER OR LOWER (ten fair pairs, one miss ends the streak; 597 stable values in 18 stats)
- [x] Reveal panel after each of the six; first-time rules cards; HOW TO PLAY updated
- [x] Order: Standard = 12 different of 20, Marathon = all 20 + 4 spread repeats; no two of the same category back to back
- [x] Tests: tests/overclock-2.test.mjs (banks, solvability, scoring, 8-player director run, thousands of orders) +
      E2E tests/integration/e2e-oc-2.mjs (8 players, touch swipes, refresh mid-Make 24, host killed mid-Sort It)
- [x] Color Clash now asks for the TEXT color (the word "ink" confused people)

### ✅ Idle rooms close
- [x] A room with no game for an hour closes: 10-minute lobby countdown (host can KEEP OPEN), live close for everyone,
  and phones returning the next day land on the title with a message instead of the stale room

## Next up (agreed plan, in order — not started)
1. **Smoke test on a normal phone tab.** The E2E suites only use `?slot=` test tabs, which hid the lobby "null" bug. A ~1-minute
   test: plain tab (slot 1), lobby, one round of each game, and fail on any visible "null"/"undefined" text.
2. **Split `js/games/overclock/view.js`** (~1,600 lines) into one file per challenge plus shared helpers. Code-only, no data or
   Firebase changes.
3. **Overclock QUICK mode: 6 challenges** for shorter games (next to Standard 12 / Marathon 24). Six all-different types with the
   usual category spread; update `MODES`, the options, the time estimate, tests.
4. **New game: imposter word game** (3–8 players, text-only, no voice call needed — fewer steps = more play).
   Everyone gets a secret word except the imposter (who sees only the category) → clue round: everyone types one word at
   once, all revealed together → second clue round → accuse: tap a suspect + optional one-line reason, shown with the votes →
   reveal; a caught imposter can steal the win by guessing the word. ~2–3 min per round, new imposter each round, nobody
   eliminated. Keep the role/word off the readable room data (like Cipher's obfuscated secret). Room chat stays open.

## Future ideas
- **New game: drawing telephone** (like Gartic Phone / Telestrations; 4–8 players, works with 3; no voice needed).
  Everyone types a secret prompt → the next player draws it on their phone (finger canvas: a few colours, 2 brush sizes,
  undo/clear, ~60–90 s) → the next sees only the drawing and types a guess → draw ↔ guess alternate until every chain has gone
  around → the reveal plays each chain step by step for everyone (drawings replayed stroke by stroke). Everyone works at once
  in every phase; drawings stored as strokes (tiny); server-clock timers; an offline player's step becomes "(ran out of ink)".
  Optional tap-voted awards ("Best drawing", "Most lost in translation") and a shareable image of the funniest chain.
  ~10–15 min a game — pairs well with the imposter game (quick suspicion vs. slower laughs).
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
- **Profiles:** optional persistent stats and achievements across nights (would need a non-anonymous sign-in).
- **Localization:** Spanish/French/German UI and question banks.
- **Haptics on iOS:** not possible from the web today; revisit if Safari adds an API.
- **Moderation:** a host button to hide an offensive Bluff lie before voting.
- **Analytics:** lightweight, privacy-respecting play counts per game to see what the group loves.
