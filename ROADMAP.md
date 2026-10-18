# NEON SPEAKEASY — Roadmap

> The name lives in `APP_NAME` (`js/config.js`), plus `<title>`/meta in `index.html`, `manifest.webmanifest`, the logo
> (`js/ui/logo.js` → `scripts/build-boot-logo.mjs`) and the icons/preview (`tests/integration/render-assets.mjs`).
> It was NEURAL ARCADE until October 2026.

NEON SPEAKEASY — *game night, after dark.* One web app, ten games, 2–8 players, each on their own phone — same room or different cities.
A host creates a room (4-letter code), friends join, the host picks a game. After a match everyone
returns to the same lobby (or the host hits REMATCH) without anyone rejoining.

Hosted at **neonspeakeasy.com** (since Oct 2026; games.loewfizzle.com and trivia.loewfizzle.com permanently redirect here) (Vercel, static, deployed from GitHub `Loewfizzle/trivia`).
Backend: Firebase Realtime Database + Anonymous Auth, and four Vercel serverless functions (`/api`, firebase-admin) for profiles,
server-verified results and THE BOARD.

## The games — all ten are playable

| # | Game | Style | Identity | Status |
|---|------|-------|----------|--------|
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

### ✅ Stage 7 — DOUBLE AGENT (social deduction)
- [x] Host options: 3/5/7 rounds, REMOTE (debate in chat) or SAME ROOM (talk out loud), 1 or 2 agents (2 only with 7+
      players; they don't know each other), clue timer 15/20/30 s, debate 60/90/120 s, 1 or 2 clue rounds
- [x] Round: BRIEFING (press-and-hold classified file; remote agent = inverted card, RGB split, shake, darker sound,
      stronger buzz; SAME ROOM = every reveal identical in size, brightness, animation, sound and haptic — checked
      numerically by the E2E) → CLUES (random order, agent never first; dossier tiles decode letter by letter; one word,
      blocks the secret word / plurals / containing it / repeats with a gentle message; timeout = NO SIGNAL) → DEBATE
      (full-screen chat or TALK IT OUT; movable suspicion pins in the pinner's colour; host ends early) → VOTE (30 s,
      changeable until locked, votes appear as pins; tie = agent escapes; 2 agents = top 2 unmasked) → UNMASKING (static,
      surveillance zoom, INNOCENT stamp or a fracturing DOUBLE AGENT; real agents always revealed; music ducks) →
      LAST CHANCE (20 s to type the word) → case-file round scores
- [x] Scoring: escape +200, caught but named the word +150, caught + missed = 0 and every innocent +100, +50 for each
      innocent who voted for an agent; podium, rematch, game-night points
- [x] Secrets never in the open room data: `spy/{code}/key` (host-only seed, the deal is derived from it so a new host
      deals identically) and `spy/{code}/card/{uid}` (readable only by that player); clue checks enforced by the host
- [x] Stability: offline on your turn = skipped, an agent who leaves for good voids and re-deals the round, rejoin and host
      migration in every phase, late joiners spectate and are dealt in next round; no word repeats within a room
- [x] Three owner tracks (spy1–3) as a crossfaded in-order playlist across rounds; synthesized reveal / agent / decode /
      pin / vote / unmask / stolen sounds
- [x] Tests: tests/agent.test.mjs (rules + 8-player match simulations), 4 rules tests, E2E
      tests/integration/e2e-agent.mjs (8 players, both modes, 1 and 2 agents, 31 checks)

### ✅ Stage 8 — PRISM DROP (falling-block battle, the showpiece)
- [x] Engine: 10×20 + buffer, the 7 shapes with standard rotation + wall kicks (unit-tested against the reference states),
      seeded 7-bag (identical on every phone), hold, 5 next, ghost, 500 ms lock delay with 15 resets, soft/hard drop,
      twist detection (3-corner rule, minis), modern scoring (level, combos, back-to-back, perfect clears), fixed 120 Hz steps
- [x] BATTLE: attack table, countering, junk with one gap per attack + incoming meter + ~1 s delay (2.5 s near the top),
      RANDOM / ATTACKERS / DANGER targeting, speed every minute, sudden death after 5 min, KO credit, KO badges (+25–100 %),
      FINAL DUEL (title card, darker world, music lift, the rival's board enlarged), announcements, Call the Winner (10 s,
      game-night bonus scaled by players left), results with KOs / badges / lines sent / combo / best clear / calls
- [x] SCORE RUSH: one song, live leaderboard, reboot on top-out, finale on the song's final beat
- [x] Controls: drag/tap/soft/flick/swipe-up gestures tuned so sideways swipes never hard-drop (2000-swipe unit test + real
      touch E2E), optional button layout, sensitivity + button size + reduced effects, light haptics, no scroll/zoom
- [x] Five owner songs analysed (BPM, beat grid, key, energy, final beat) with `scripts/build-prism.py`; a seeded room playlist
      that never repeats until all have played and continues across matches; songs crossfade mid-battle
- [x] Five WebGL worlds × 3 variants (aurora ocean, neon city, deep nebula, crystal cave, synth sunset), beat/energy-reactive,
      bloom + hue drift on combos, colour waves + prismatic shards on big clears, danger drain + vignette + underwater music,
      junk glitch; quality tiers (60 fps at all tiers on a 4× throttled CPU at phone density)
- [x] Musical SFX synthesized in each song's key: moves/rotates, lock pluck, hard-drop thump, clears quantized to the next 16th
      (1 note → a full rising run), twist chimes, combos climbing the scale, perfect-clear chord, junk warning/impact, KO,
      badge shimmer, FINAL DUEL hit, countdown on the beat
- [x] Rules for `prism/prismq/prismcall/meta.prism`; tests: engine + match/director/gestures/8-bot battles, 4 rules tests,
      E2E `tests/integration/e2e-prism.mjs` (8 players, 40 checks)

### ✅ Stage 9 — NEON DISTRICT (rebrand + the front door)
- [x] Renamed NEURAL ARCADE → NEON DISTRICT everywhere (name, titles, manifest, boot screen, lobby header, share text, link
      previews, docs); the games keep their names; same domain
- [x] A neon-tube logotype (`js/ui/logo.js`) reused in the title, lobby header, boot screen, app icons and the link preview;
      new icon set + 1200×630 preview rendered from the real scene
- [x] The title is a living night district: 4 parallax skyline layers, power-on light wave, holographic billboards showing
      the games, searchlights, flying traffic, rain, a wet street reflecting everything, tilt/mouse parallax
- [x] Opening sequence: TAP TO ENTER (unlocks audio) → the city wakes → the sign powers on (flicker, hum, crackle) → the menu;
      ≈3.4 s first time, ≈1.2 s returning, instant within a session, skippable, reduced-effects fade
- [x] Menu: one-tap HOST, inline 4-box JOIN (type / paste / invite links / auto-join), REJOIN, welcome back + EDIT, a game
      showcase with preview sheets; settings gear + version in the corners; wide-screen layout
- [x] Synth ambience (hum, crackles, power-on swell, a low rain bed); 60 fps at every tier on a 4× throttled CPU; full cleanup
- [x] E2E `tests/integration/e2e-title.mjs` (41 checks, 3 sizes, intro videos); every older E2E updated for the new title
      (`?emu` pages skip the intro)

### ✅ Stage 10 — SLIPSTREAM (survival ride)
- [x] Seeded spline courses: crests tuned to launch speeds, a calm start, hazards unlocking in order and sized by probe rides,
      sudden death from 6:00, a 9:00 hard stop; biomes DUSK DUNES -> shuffled CRYSTAL CANYON / FLOATING CITY / LIGHTNING STORM ->
      OPEN SPACE, 3 variants each; a rollout bot proves whole courses and every hazard section survivable (unit tests)
- [x] One-thumb physics at 120 Hz: dive, launch, flips, landing tolerance + assist, flip boosts + combos, gravity-flip mirroring,
      crumbling tiles, crash -> 0.9 s rewind -> respawn with 2 s shimmer; lives 1/2/3
- [x] Multiplayer: local sim on the server clock, ~10 Hz publishing, interpolated ghosts with name tags + their rides/trails,
      progress bar with lives, announcements (eliminations, combos, the lead), LAST RIDERS cinematic + music, spectate any
      rider, Call the Winner, rejoin near your last spot, host migration, late joiners spectate, same-moment crashes by distance
- [x] Look: WebGL biome skies, Canvas 2D world (parallax silhouettes, light-line track, hazards, trails, shards, flashes,
      lightning, light-birds / meteors / airship), quality tiers; equal look-ahead in portrait and landscape, a rotate hint
- [x] Rides: HOVERBOARD / LIGHT-CYCLE × RIBBON / SPARKS / LIGHT WALL (looks only), picker in the countdown + settings
- [x] Eight owner songs (slip1–8) analysed with `scripts/build-slip.py`; the shared room playlist; adaptive biome treatments,
      airtime swell, near-crash dip, crash muffle; synth SFX
- [x] Rules for `slip/slipcall/meta.slip` + 3 rules tests; unit tests (22); E2E `tests/integration/e2e-slip.mjs` (8 players, 35 checks), look preview
      `slip-preview.html` + `slip-shots.mjs`; 60 fps at every tier at 4× CPU (4–5 ms of work a frame)

### ✅ NEON SPEAKEASY (rename + menus in the title's language)
- [x] Renamed NEON DISTRICT → NEON SPEAKEASY on its own domain (neonspeakeasy.com): name, titles, manifest, boot screen, the sign
      ("SPEAKEASY" framed by Art Deco rules with diamonds), lobby header, link previews (re-rendered og.png + icons), docs
- [x] Setup, lobby, every sheet (options, settings, help), chat and toasts in the title's neon glass, over a still of the lit
      district; player avatars as neon glass emblems with a different shape each; colour swatches as glass orbs

### ✅ Stage 11 — GRIDLOCK, Part 1 (fleet battle: core + CLASSIC + BATTLE ROYALE)
- [x] Core: 10×10 / 5 ships for 2–3, 8×8 / 4 ships for 4+; drag-and-drop placement with rotate, invalid glow, AUTO-PLACE, READY,
      a timer that places the rest; public hits/misses on every board, ships revealed only when sunk; eliminations; results
      (placement, accuracy, hits, sunk, eliminations), podium, rematch, game-night points
- [x] CLASSIC: turns in a seeded order, one shot, pick a target + cell + FIRE (confirm step), 20 s timer → a random shot, offline
      players skipped; everyone watches each shot land
- [x] BATTLE ROYALE: 20 s aim phase with locked-in secret cells, TARGET LOCK warning (who, not where), simultaneous cinematic
      resolution with same-cell credit, points (10 / 30 / 50) and a BOUNTY on the leader (×1.5), 25-round safety cap
- [x] Privacy + stability: fleets in an owner+host-readable node outside the room, resolution on the target's phone with a 4 s host
      fallback, rejoin restores everything, host migration in every phase, late joiners spectate, Call the Winner
- [x] Look: three.js holographic boards (grid/rim/shimmer/radar-sweep shader), ships as etched light-forms, beams, impact rings +
      fractured marks, shatter-and-sink, power-down, cinematic camera, the district below; tiers; menu accent steel-blue/orange
- [x] Audio: a seeded playlist of spy1-3 + last-signal with ducked/filtered volleys; synth SFX (snap, rotate, lock, TARGET LOCK,
      beam, impact, ripple, shatter, power-down, bounty)
- [x] Rules for glready/glshot/glres/glcall/fleets + 3 rules tests; 14 unit tests incl. whole matches; E2E `tests/integration/e2e-gridlock.mjs`

### ✅ The match kit + the docs split (Oct 2026)
- [x] `js/games/kit/`: announcer lane, title cards, Call the Winner, the report under the podium, quality tiers, test hooks —
      extracted from PRISM DROP / SLIPSTREAM / GRIDLOCK, which now use them (zero visual change: each keeps its own prefixed CSS);
      `css/kit.css` gives a new game the look with no CSS of its own (`docs/match-kit.md`)
- [x] `tests/integration/kit/harness.mjs`: the E2E harness (N phones, room create/join, screenshots at the review sizes, real touch,
      kill the host, refresh, frame pacing, the report) — e2e-slip and e2e-gridlock run on it
- [x] CLAUDE.md cut from 100 KB to 18 KB: ground rules, layout, the shared core, the checklist; every deep-dive moved verbatim to
      `docs/*.md` (read on demand) — a large fixed cost off every session and every context compaction

### ✅ GRIDLOCK presentation rebuild — flat (Oct 2026)
The Part 1 play-test found the tilted three.js ring hard to read on a phone (cells trapezoid, labels off the grid, hits lost
under the hulls, the 3D view "weird"). The renderer was replaced; rules, director, privacy model, rules file and tests stayed.
- [x] `scene.js` rewritten in Canvas 2D: one straight-on holographic board fitted to a CSS stage box, coordinates printed inside
      its frame and centred on the cells (the E2E asserts `cellXY` ⇄ `pick` agree), edge-lit glass panel, hull light-forms,
      scars burnt into the cells/hulls (black hole, molten rim in the shooter's colour, cracks), ripple misses, beams from the
      shooter's mini-board, impact flash + shockwave + sparks + shake, sinks that burn white and shatter into shards leaving a
      wreck, eliminations that flicker/tear/go dark, a radar sweep; base + marks as cached layers (a frame ≈ 2 drawImage + hulls)
- [x] Every other fleet is a mini-board (canvas in a `.gl-mini` button: avatar, name, ships-left pips, OUT, bounty ◆; the
      target gets the orange ring, the board that is up lights, the Classic shooter gets a dot); phone strip / desktop column /
      landscape column; the strip starts at YOU and scrolls the target into view
- [x] Three sizes + landscape reviewed over three passes (board hugs the header, denser scars, wreck visible under them, desktop
      header scale, landscape tray wraps beside the board); `gridlock-preview.html` now mounts the real view (fake-firebase.js)
- [x] three.js is no longer loaded by GRIDLOCK (NEON PAR still uses it)
- [x] Play-test fixes: the board grew (phones: edge to edge, the mini strip moved above it, cells 34 px on a 390-wide 10×10 and
      43 px on 8×8; desktop: the whole height, ~850 px at 1440×900, with the HUD in side columns); the stage is measured with
      offsets so the board no longer lands where the screen's entry transform put it; a one-tap music button joins the gear and
      chat in every game's corner column

### ✅ Stage 12 — GRIDLOCK, Part 2 (SALVO + ARCADE) (Oct 2026)
- [x] Four modes as mode cards in the options sheet (icon, line, player count): CLASSIC · SALVO · BATTLE ROYALE · ARCADE
- [x] **SALVO:** one shot per ship afloat, numbered markers across any boards (tap to lift, a tap past the allowance moves the
      last), a shots-left counter, every marker its own beam in the volley; the aim phase runs 10 s longer
- [x] **ARCADE:** a fanned hand of glass ability cards (2 to start, +1 per sink, 3 max, seeded deal); arm one and the targeting
      adapts (3×3 / 2×2 preview, torpedo lane with ROW/COL + FLIP, a dome preview on your own board, drag-to-relocate with the
      placement rules); a card replaces the shot; CANCEL puts it back. Six cinematics: sonar rings + the lit 3×3 (and a private
      readout for the scanner), a projectile that splits into four, a streak along the lane that hits or fizzles off the edge, a
      hexagonal dome that rises and sparks when it blocks, a hull that dissolves and re-forms (others see a shimmer), two rapid beams
- [x] Rules: one obfuscated lock-in node `{ ts, x, a?, at }` for every simultaneous mode (who is public, where is not), shields and
      relocates before attacks, blocked shots leave no mark, torpedoes stop at the first unhit cell, sonar answers in a top-level node
      only the scanner can read, relocates rewrite the private fleet before locking in; `database.rules.json` + rules tests for all of it
- [x] Results: Salvo shows shots + accuracy, Arcade abilities used / shots blocked / best volley; rejoin keeps cards (public) and the
      unsent plan (sessionStorage per volley); host migration and the owner-offline fallbacks cover the new nodes (the host re-reads a
      fleet before resolving, since a relocate may have moved it, and answers sonars for absent owners)
- [x] Balance (`scripts/sim-gridlock.mjs`, bot vs bot through the real director, 100 matches a cell): the round cap now scales —
      at 25 every 2–3 player Royale/Arcade match ended on "most cells afloat" (one shot a round can't sink 17 cells); it is 36 / 30 /
      25 rounds for 2 / 3 / 4+ players in Royale and Arcade, 25 / 22 in Salvo. No seat advantage beyond noise (2p 46–54 %, 8p 5–20 %
      with 100 samples). No ability dominates: win rates of its users sit within a few points of fair for every card at every table
      size; RELOCATE swung most with its weight, so it is dealt a little less (0.75) and SONAR a little more (1.2). Bot matches run
      ≈ 9 min (Salvo 2p), 11–13 (Salvo 4–8p), 9–10 (Arcade 4–8p), and ≈ 12 (Arcade / Royale 2p, mostly to the cap — the bots hunt at
      21 % accuracy; people hunt better and lock in faster)
- [x] New SFX in the layered style (marker, volley, card draw / arm / play, sonar + its answers, cluster split, torpedo, fizzle, shield up,
      shield block, relocate); help text for both modes; E2E matches C (Salvo) and D (Arcade) on the harness
- [x] **The rules file changed: re-publish `database.rules.json` in the Firebase console.**

### ✅ Profiles, THE BOARD and SPEAKEASY RANKS (Oct 2026) — `docs/profiles.md`
- [x] **Automatic profiles, no signup:** made by the server on a device's first contact from the name / avatar / colour it already
      uses (existing players on their next visit); Name#4821 tags unique per name; live emblems + tags in the lobby, chat, podium
      and results lists (the room seat carries the profile id; the rules accept only your own)
- [x] **Profile key** NEON-XXXX-XXXX-XXXX (32-letter alphabet, no O/0/I/1, 60 bits; only an HMAC on the server; restores rate-limited):
      restore on a new phone / browser (the blank profile it made is removed), view + copy, a new key retires the old; a reminder sheet
      after the 3rd and 10th match until it's saved; the profile screen explains Safari vs the Home Screen app
- [x] **Server-verified results** (`/api/report`): every phone reports at the podium; the server reads the match from the room itself
      (a reporter's snapshot only when the room moved on, and only if it agrees with the host's game-night record), checks every
      record for plausibility per game, and applies each player exactly once (one transaction per player stats node keyed by match);
      a localStorage queue retries offline reports; clients can no longer write boards, stats, XP or ranks (rules)
- [x] **Boards** for every game: records (SLIPSTREAM distance, PULSE per song × difficulty, Score Rush, OVERCLOCK Standard, CIPHER best
      match + fastest 5-letter solve, NEON PAR 9 holes to par) and career (wins, win rate after 10 games, GRIDLOCK wins per mode +
      fleets sunk, DOUBLE AGENT escapes + agents caught, LAST SIGNAL eliminations, NEURAL BLUFF players fooled, PRISM DROP KOs);
      THIS WEEK (keyed by Monday 00:00 Eastern, no reset job) and ALL TIME; top 100 paged + your exact rank anywhere; CDN-cached reads;
      names joined at read time (a rename shows everywhere, past records too); offensive names read "Player#tag" (always-on filter);
      renames once a day (the tag follows when free); "Show me on global leaderboards" (off: still counted privately)
- [x] **SPEAKEASY RANKS:** NEWCOMER → REGULAR (250) → INSIDER (2,000) → MADE (7,500) → LEGEND (25,000), XP on the server for every
      match (placing, wins scaled by table size, personal bests, a new game tonight, variety); five emblems from a steel token to an
      ornate sunburst (an SVG sprite, a bold mini drawing for 15 px)
- [x] **THE BOARD** (the title's third door, and neonspeakeasy.com/board for anyone, with PLAY NOW and its own link preview): the
      speakeasy's back room in Canvas 2D — mahogany and brass, Art Deco windows onto the night city, a lit back bar, pendant lamps,
      haze, a slow camera drift — and a luminous scoreboard: game tabs that relight the room in each game's colours, cascading rows,
      gold / silver / bronze top three, your row pinned in your colour
- [x] **Results moments** on every podium: NEW PERSONAL BEST / #14 WORLDWIDE / ENTERED THE TOP 10 / #1 THIS WEEK plaques with a light
      sweep and counting ranks, the XP bar, and a ≈ 3 s RANK UP (the old emblem shatters, the new one forges in light); the title's
      preview sheets show each game's top 3 + your rank; the membership-card profile screen; premium synth SFX (tab, cascade, chime,
      flourish, fanfare, forge); menu.mp3 on THE BOARD
- [x] **/admin** (your profile id in `ADMIN_PIDS`): search, remove a record, reset a board, rename, hide from the boards, audit log
- [x] Tests: `profiles.test.mjs` (week keys across DST, XP tuning, the name filter, keys, the catalog, every game's results +
      plausibility), `server.test.mjs` (the functions on the emulators), rules tests for the new nodes, `e2e-profiles.mjs` (the flow)
- [x] **Setup:** a Firebase service-account key + Vercel environment variables, and **re-publish `database.rules.json`** (docs/profiles.md)

## Next up (agreed plan, in order)
1. ✅ **Smoke test on a normal phone tab** (`tests/integration/e2e-smoke.mjs`, done). The E2E suites only use `?slot=` test tabs, which hid the lobby "null" bug. A ~1-minute
   test: plain tab (slot 1), lobby, one round of each game, and fail on any visible "null"/"undefined" text.
2. ✅ **Split `js/games/overclock/view.js`** (was ~1,600 lines) into `ui/<type>.js` (one per challenge), `reveals.js`, `shared.js`;
   view.js is now the ~450-line shell (done).
3. ✅ **Overclock QUICK mode: 6 challenges** (≈ 3 min) next to Standard 12 / Marathon 24; the modes are now a list with a
   sub-line, like Neon Par's course picker (done).
4. ✅ **New game: imposter word game** — shipped as **DOUBLE AGENT** (Stage 7 above).

## Future ideas
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
