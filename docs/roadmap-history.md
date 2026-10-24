# Roadmap — what shipped, in detail

Everything that shipped, with its checklists, newest work near the top of the Oct 2026 block (moved out of ROADMAP.md on
Oct 20, 2026, so the roadmap stays short; add new detail here when a feature ships).


### ✅ CITY 2.0 — MUSIC (Oct 23, 2026)
- [x] The owner's mood folders (morning 11 · day 11 · evening 14 · late 11 · party 9) → `audio/music/c2-*.mp3`: byte-identical files stored once (morning4–7 = day4–7), morning10 in MORNING + LATE NIGHT,
      evening3 = the repo's slip8 (found by cross-correlation: same audio, same timing) so listed, not copied; 112 kbps stereo, trimmed, −16 LUFS / ≤ −1 dBTP; +144.5 MB
- [x] `scripts/add-city2-music.py` — drop files in the folders, run it: dedupe by bytes, level + encode, beat grids (+ lock / kick agreement / trusted), resumable, `--reuse`, `--regrid`, `--retrust`
- [x] City 2.0's mood rule on the Harbor's own clock (`core/city-mood.js`, `core/city.js`): dawn / 11 am / golden hour / 11 pm / the party show; `&when= &speed=` and the preview panel move the music
- [x] MUSIC MOOD setting (AUTO / MORNING / DAY / EVENING / LATE NIGHT / PARTY) in both cities, saved per device; the lobby follows the host; a forced change is a 4 s crossfade, a natural one waits
- [x] The preview panel's MUSIC section (mood, SKIP, song + grid status), `&mood=`, the readout's music line; untrusted grids (15 of 51) → the kick listener leads
- [x] `MUSIC_BASE` (js/config.js) — one setting moves every music file to a CDN; the weekly-halves hook (`deckForNow`) for decks of 30+

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

### ✅ LIVING CITY (Oct 2026) — `docs/title.md`
- [x] The title city follows the player's real local sky: dawn, a hazy matinee day, golden hour, night, the small hours, driven by the
      real sun; the real moon phase; seasons (snow, petals, fireflies, leaves; flipped in the south); holidays with build-ups
      (Halloween cobwebs, bats and a neon pumpkin; Christmas lights, a Santa hat, snow and a rare sleigh; NYE countdown and fireworks;
      Valentine's, St. Patrick's, Easter, Thanksgiving, the Fourth); meteor showers on their peaks; rare aurora nights; ALWAYS NIGHT
- [x] A new tagline: YOUR FRIENDS ARE ALREADY INSIDE.
- [x] The title redesigned around the city: no game row (tappable billboards → HOW TO PLAY, a GAMES sheet, an auto-counted
      explainer line), a slim HOST / JOIN dock, the screen fades to just the sign and the city after 15 s; easter eggs (windows,
      the sign, the moon, a rooftop cat, a UFO, a satellite train); Christmas lights as lit rooflines; THE BOARD plays menu3
- [x] The city's signs replace the billboards: a rooftop art-deco marquee, a blade sign, neon icon signs (a tube mark for every game)
      and a dot-matrix ticker; rotating one at a time, off by day, holiday dress, tappable → HOW TO PLAY; the rank in the welcome line
- [x] Two blades + a rooftop billboard, neon on many more buildings, Christmas bulbs wrapped round the sign, the real night sky
      (stars + the Milky Way turning over the night), mixed-case callsigns

#### The LIVING CITY thread — decisions made on the fly (Oct 18–19, 2026), for reference
Everything below lives in `docs/title.md` (how it works) and in js/screens/district/ (scene, fx, palette, stars, signs, marks,
sign-logic) + js/core/sky.js. This is the *why* and the order things were decided in, so the thread can be picked up later.
- **The sky is real, never asked for.** Location is estimated from the time zone (no permission prompt, ever). Sun times within
  ~6 min of published tables; the real moon phase. The `?when=YYYY-MM-DDTHH:MM&tz=Zone&force=…` preview switch drives everything
  (sky, holidays, events, sign, signs, music) — `force` = bats, witch, sleigh, ufo, cat, satellites, meteor, aurora, fireworks,
  searchlights. Normal players never pass it.
- **Five looks blended by the sun's elevation:** dawn, a hazy matinee DAY (sign unlit, glass visible), golden hour, NIGHT (the
  hero), late night. The windows wind down from 10 pm (≈ 90% at 10:30, 70% near midnight, a third from 2 am); the neon on the
  buildings stays at full strength all night (it had been tied to the windows — fixed).
- **Holidays** each have a build-up and full days, and dress the sign itself: per-letter tube colours (Halloween orange/violet,
  Christmas red/green, NYE gold, Valentine's rose, St. Patrick's green, Easter pastels, Thanksgiving amber, the Fourth red/white/blue).
  - Halloween: an orb web with dew beads + a spider that drops from the E on its silk (it must hang from the tube, not the sky);
    the O becomes a full-size neon jack-o'-lantern with its stem above the letters; bats in a random neon (sometimes mixed); a rare
    witch on a broom; jack-o'-lanterns in lit windows (more each build-up day); a neon pumpkin on a roof near the middle.
  - Christmas: a wire of glass C9 bulbs wound round the sign's own tubes (a few lit Dec 1, all by Christmas Eve); a velvet Santa
    hat; lit rooflines across the city; snow; a rare sleigh with Rudolph's nose (it must read on a phone: flown through open sky).
  - St. Patrick's: the O becomes a four-leaf clover as tall as the letters.
  - NYE: a countdown in the tagline, then fireworks and HAPPY NEW YEAR.
- **Sky events:** meteor showers on their real peaks, a rare single star any clear night; aurora about one night in five, any
  season (too beautiful to be rare; the strips are feathered so it reads as one curtain, not bars); rain in about one 4-hour
  block in four (random by date, the same for everyone — real weather was rejected: it would need location permission). The
  rain SOUND plays only while it rains on screen.
- **The night sky:** the real brightest stars in their constellations + the Milky Way, turning with the sky; every clear night,
  richer late, washed out by a bright moon.
- **The moon:** its real path, framed. On phones it arches over the sign from beside the first N (moonrise) to beside the last
  (moonset), may pass behind the corner buttons (not tappable there); on desktop the full arc.
- **The title page:** the scrolling game row was removed (it hid the city). A slim HOST / JOIN dock (JOIN opens the code boxes),
  quiet links (THE BOARD, GAMES), the rank in the welcome line ("Welcome back, BEN · ◆ REGULAR I"; no EDIT button — the card has
  it), the "12 PARTY GAMES · ONE PHONE EACH" line only for first visits (counted from GAMES). After 15 s untouched the menu fades,
  leaving the sign and the city; a tap brings it back without pressing anything.
- **The city's signs** replaced the screenshot billboards (they looked cheap): built in the main sign's tube language, data-driven
  from GAMES (a mark per game in marks.js). The marquee was tried and removed (it looked out of place in the neon city). Phones:
  two blade signs (left and right; only names that fit at a readable size; thicker tubes, softer glow), a rooftop billboard with
  the game's mark (any well-visible roof, ≈ 60% of its width, clear of the edges so the phone tilt can't push it off), and a
  bright dot-matrix ticker (tapping it opens the name under your finger). One sign changes every 12 s. Every sign is tappable →
  HOW TO PLAY (pointer events: iOS never sends click to the canvas — that cost a round).
- **Neon on the buildings** is seeded random (the same city for everyone; widths depend on the screen). Each building rolls a
  chance per row and a style (outline, roof line, strip, bands); tall back towers that peek over the front rows usually get a full
  outline (portrait only shows a slice of the back rows). The back rows are thinner and softer so the depth reads — making them as
  bright as the front made the city feel cramped.
- **Phones:** the buildings run further down to meet the dock (rooftops unchanged), Safari's shorter visible area is part of the
  screenshot matrix (390×664, 393×659, 430×739), and the city must work in portrait first.
- **Searchlights** are an occasion: Friday / Saturday nights and holiday nights, upright at the sides, never across the sign.
- **Easter eggs:** a tapped sign letter stutters; the moon shimmers (silent; three taps send a shooting star); a rooftop cat on about
  one night in three; a polished UFO with a tractor beam (clear nights, every 8–18 min); a rare satellite train. The window
  on/off egg was removed.

### ✅ MOOD MUSIC (Oct 2026) — `docs/audio.md`
- [x] Menu music follows the time of day: LATE NIGHT (lo-fi), MORNING, DAY, EVENING (night-drive synthwave), PARTY (Fri / Sat 8 pm
      → 2 am), from the real sunrise / sunset; every screen but the games and their podiums, plus the public /board (after a tap)
- [x] A mood change waits for the song to end; a shuffle bag per mood (no repeats until all have played)
- [x] Lobbies play ONE song for everyone on the server clock, chosen by the host's clock; late joiners and host changes carry on
- [x] The owner's two lo-fi songs (late1, late2) as KEEPERS; every other track analysed (tempo, loudness, brightness, busyness, key)
      and sorted into a mood as TEMPORARY in data/mood-music.json; MENU MUSIC: TIME OF DAY / CLASSIC in settings

### ✅ CITY 2.0 — THE HARBOR, NEON PASS 6: NIGHT TOUCH-UPS (Oct 22, 2026) — `docs/harbor.md#neon-pass-6`
- [x] THE RACING FLOWS: the party racers' speed came from the beat phase (a quarter speed between beats + the beat clock's jitter) →
      a steady speed from the tempo (eased to a new song's), the dt of the frame (30 Hz the same), the punch only brightens + lengthens
      the tail; no reversals. iOS: the song's coarse `currentTime` carried forward between its steps; the readout says why it's calm
- [x] THE SKY BEAMS as Neon Pass 5 (a rebuild tried + reverted on the owner's word): a soft FOOT instead of the hard bottom line; the
      far-right beam rises behind the music + menu buttons like the others
- [x] THE WHEEL: one smooth glow hugging the rim (no ghost ring); behind it a dusky violet-blue backdrop — a tone each, a rim of city
      glow, ~1 window in 12 warm, rooftop tanks / antennas / sheds
- [x] SIGNS: the six small floating icons removed — 4 named signs + the billboard (a game with no sign tonight; `billboardPick`, pure),
      every game over the nights (tested); the lighthouse's CALM ZONE (a quiet white roofline behind it); its party beam stronger,
      wider, now and then the party's colour
- [x] NEON + ARCHITECTURE: the side faces traced (the roofline across both faces + the far edge), ledge bands on the window grid's
      floor lines, fins on its piers; the crowns under the right-hand roof signs restored (a re-layout cut the OLD signs' cabinets out of
      the new outlines' sprites — her phone's safe areas re-lay once) + the sign's glow spilling onto its frame + roof
- [x] THE NEON LOGO RACES: N → E → O → N along the tubes + connectors, each letter blazing, then a sweep across SPEAKEASY — party nights
      every ~40–70 s, at the catch (riding on its timing + sound), on a re-ignite; opacity + transform only (`&force=race`)
- [x] The screen at rest after 10 s (was 15), both cities
- [x] Tests: harbor.test (signs without icons, the billboard covering every game), E2E "THE RACING FLOWS" + "THE NEON LOGO RACES";
      the A-B-B-A (night cheaper; party noisy, tier 0 equal) — the owner's iPhone decides

### ✅ CITY 2.0 — THE HARBOR, NEON PASS 5: SAFARI, THE REAL BEAT + THE PARTY POLISHED (Oct 22, 2026) — `docs/harbor.md#neon-pass-5`
- [x] Faster harbor tests, nothing dropped: e2e-harbor in GROUPS (`ONLY=…`), three parallel shards + panel + perf alone, the fixed
      sleeps → waits for the real condition (223 s → ~190–200 s, 87 → 99 checks)
- [x] THE iPHONE SHOWED LESS: a 30 Hz frame rate (Low Power Mode) stepped the city to tier 0 (no racing) — a step down is a probe now
      (no faster frames → back up, "capped 30 Hz"); one sky beam → every hero + word tower's beam, behind the sign (the whole-sky rule);
      a leftover JUST ME state replaced a link's flags → a fresh link wins, the pill shows JUST ME + a ✕; Safari-safe canvas
      (`ui/canvas-safe.js`: no filter without a pixel test, clipped source rects, no thrown frame out of canvas memory). WebKit itself
      couldn't be installed here (logged)
- [x] Sign names ≥ 10 pt at 390 (were 4–9): STACKED roof signs (the mark on top, the name across), a bigger billboard with the name
      across it, the blade's letters closer; PAR's narrow name + the icon left of the wheel removed (10 signs a night + the billboard)
- [x] THE REAL BEAT: every mood song's exact grid (bpm, first beat, downbeat — the old BPMs were wrong), an AnalyserNode hearing the
      kicks (their strength sets the punch; a breakdown calms it), latency-compensated, half-time (beats 1 + 3), a calm pulse without music
- [x] The party: a ROTATING PALETTE (six colours + white accents, a new pair every scene in a sweep), racing at ~half speed locked to
      the bar with big white heads + long tails on every tower, every beam in its tower's changing colour, THE WHEEL a showpiece
      (bigger bulbs, halo, warm gondolas; a colour wave + spirals on normal nights, clock hands / spirals / bursts on party nights),
      THE NEON LOGO punching (gentler), the tired tube rotating (the O got its hot spots), random flickers; the roof string lights off
- [x] The panel: every sky event fired from it appears (forced pieces override the lane + cooldown gates; the satellite train repeats
      + jumps to dusk; ☾ events + PARTY ON by day jump to tonight; the sheet peeks); tests per event

### ✅ CITY 2.0 — THE HARBOR, NEON PASS 4: THE NEON IN MOTION (Oct 22, 2026) — `docs/harbor.md#neon-pass-4`
- [x] A party night obvious in one frame: the outlines re-lit in the bold PARTY SCHEME (rolling in left → right), a warmer pink-violet
      city glow, SKY BEAMS from the tall towers (2–3 on a phone, 4–5 on desktop; fading under the tagline, free ones to the top;
      pulsing, swapping colour, one by one from 9 pm, taking turns with the searchlights; reusable for holidays + the tribute)
- [x] LIGHT RACING round the tubes (white-hot heads, coloured tails, per-building speed + direction, reversing, surging on the beat),
      THE HARD BEAT (a ~50 ms attack to a big swing, harder on the downbeats + drops — never dark, never a hard on/off) on the tubes,
      the signs, the blade's marquee, the wheel, the pier lamps, the string lights, the beams, the title's rings + SPEAKEASY
- [x] Flashes (crowns on the strong beats, colour-to-colour strobes in the new race+strobe scene), the shimmer rolling across the
      skyline; scenes every 20–40 s; the harbor's night: 9 pm warm-up → 11 pm peak → calming after 1 am
- [x] Every night alive: three or four slow chasers, one or two blinking names, a crown shimmer every ~20 s
- [x] STRING LIGHTS on the speakeasy's roof (warm; a party night's colours chasing on the beat; reusable)
- [x] The wheel without a veil: quiet office blocks behind it (few warm windows, a touch more haze), seven bulbs a spoke, a bolder
      rim, a hub medallion, the spoke bulbs chasing outward on the beat
- [x] Fixes: no sign clipped at 390–430 (tested), the blade's whole word readable, no seams in the water, beams + flares hidden by the
      signs in front of them, the JAZZ sign removed (its icon moved), the neon sounds ~12 dB quieter (power-on / dropout −6 dB) with
      a soft attack + low-pass + a peak cap, the warm-up's last 30 s audible; RUMRUNNER's lobby sign "CLUB 21"
- [x] The preview panel: SKY BEAMS, STRING LIGHTS · PARTY, the race+strobe scene; tests: harbor.test (the hard beat, racing, the sky's
      turns, the night's curve, the everyday motion), e2e-harbor (the party scheme, beams, the punch, the strings)

### ✅ CITY 2.0 — THE PREVIEW PANEL (Oct 22, 2026) — `docs/harbor.md#the-preview-panel`
- [x] ONE registry (`js/core/harbor-remote.js`, pure, shared with the server): every `&force=` preview the Harbor runs (43), the party
      show's scenes, time presets from the real sun, weather, holiday looks, durations; validation to plain values; the state → the
      links' URL flags; the status line. A unit test fails when a preview is missing from it, or a row is read by nothing
- [x] The city applies it LIVE (`createHarbor().remote`): the clock, the &force= set and the flags swapped in place, what a preview
      leaves behind put back; time jumps + a sky piece's first flight in sync from the state's start on the server clock
- [x] The owner's TEST pill (admins only, top left) + a glass sheet two thirds high (the city stays in view): JUST ME (live, kept for
      the tab) / EVERYONE ON CITY 2 (a draft, FOR 15–120 MIN, SEND TO EVERYONE), the status, EVENTS with their inputs, PARTY SHOW,
      TIME, WEATHER, HOLIDAY, TOOLS (readout, grid, CLEAR ALL); every target ≥ 44 pt
- [x] EVERYONE: `/api/admin cityLive / cityClear` (ADMIN_PIDS, validated, audited) → `city2/live` (rules: signed-in read, server-only
      write); every phone on `?city=2` listens after the first paint and plays it until `until`; the default city never listens
- [x] Tests: harbor.test (registry ↔ code, validation, flags, sun times, holidays), server.test + rules.test (CITY 2.0), e2e-harbor
      (`ONLY=panel`: JUST ME live + refresh + clear; EVERYONE on two phones in sync incl. a late arrival, until, clear); shots: panel scenes

### ✅ CITY 2.0 — THE HARBOR, NEON PASS 3: THE WOW PASS (Oct 22, 2026) — `docs/harbor.md#neon-pass-3`
- The review's fixes: the wheel SEE-THROUGH (no veil; lit struts, a haze ring), THE GAME BLADE readable (bulbs on an outer frame, a dark
  gap, bigger brighter letters on a near-black panel, a calm chase), THE DRONE SHOW in open sky (under the word, over the tallest crown).
- The night city spectacular: neon on ALMOST EVERY building (outlines, ledge bands, pilasters, fins, sunbursts, chevrons, trims; setback
  ledges on the towers), a BOLD BUT DESIGNED palette (five new colours, up to three a building from designed pairings, neighbours
  contrasting, warm near / cool far), THE LIGHTHOUSE IN NEON (red + white, the keeper's house amber), coloured rooms, the city's
  violet / teal light on the night air, the pier's bulb strings, a brighter waterfront.
- DEPTH through the neon (the owner's most important note): four steps by distance — near tubes thick, bright, crisp; landmarks
  finer; the middle tier softer; the far band thin, soft and sinking into the haze; finer trims than outlines on every building.
- THE EVERYDAY MOTION: a sign spells on, another blinks, an icon cycles its colour, one or two slow chasers — calm and sparse; a few
  buildings rotate their colour, a few change scheme through the night (evening → late night → small hours); a BURNT-OUT LETTER on
  one named sign ~once a month for two days (`&force=burnout`).
- THE PARTY SHOW (`core/harbor-show.js`, pure + tested; moved up from Part 10): scenes on the beat — ripples, colour sweeps, ledge
  climbs, fins in sequence, call-and-response, chasers round whole outlines, crowns on the drops; a quarter of the city steady; it
  builds warm-up → peak (searchlights, the wheel's party colours + sparkle, PARTY WINDOWS) → after; the NEON word on the biggest
  drops; never strobe-like (tested); tier 1 ≤ 5 effects, tier 0 one breathing image. `&scene=` previews; Part 10's hooks.
- The neon sounds retuned: a silent warm-up + dawn (the last dropout only), the lit sign's flickers sound, the hum fades out 10 s after
  the catch, a tap on the sign sounds (dropout / power-on).

### ✅ CITY 2.0 — THE HARBOR, NEON PASS 2 (Oct 21, 2026) — `docs/harbor.md#neon-pass-2`
- The building neon fixed from the owner's zoomed iPhone review: each line cut at its own depth against the nearer buildings (a tower's
  contour against a dilated envelope: no tube down a sun corridor), every run ending at an electrode cap, stubs dropped, nothing
  within 2.5 pt of the screen's edge; contours from the foot over the main setbacks only (`MIN_STEP`), one-step crowns, filleted
  corners; no tube through a sign / icon / billboard / the wheel; SOLID SIGNS (their cabinets cut out of the outlines' baked light);
  no sign on a hero tower (`n-empire` gone, `i-par2` added: 5 named + 7 icons); the billboard's seams under its paint; the wheel's
  quiet zone + a night-air veil; the sun + moon arch peaking just under NEON, the tagline shaded over a bright disc.
- The midsection lit: the near band warm (rooflines, Deco ledges, corner trims, fins), the mid band cool; the quay heroes trimmed.
- THE WATERFRONT STRIP (`screens/harbor/waterfront.js`): storefronts where they can be seen — awnings, warm windows, neon SHAPES on
  a phone (names on wide screens where they read), the theatre's chasing marquee, long wobbly reflections (`water.light(…, len)`).
- THE DRONES' COLOURS: per word / per letter / rainbow, the colour wave through each morph, `cycle`; in the API + `&colours=…&by=…`.
- REAL NEON SOUND: four CC0 recordings cut + levelled (`scripts/build-neon-sfx.py` → `audio/sfx/`): random flickers, the dropout,
  the power-on at the catch, a seamless hum while lit; the synth stays as the fallback.
- The iPhone's slow frames traced to GPU fill (6.7 screens of pixels a party-night frame at DPR 2): bands + their lights and the
  sky + its stars merged while steady — 5.3 (−21 %), the same picture. A-B-B-A: +0.3 ms on the bench (reported).

### ✅ CITY 2.0 — THE HARBOR, Part 6a of 12: THE EVERYDAY SKY (Oct 21, 2026) — `docs/harbor.md`
- Section 0: THE TIER ON iPHONES (iOS caps the reported core count, so every DPR-3 iPhone started at tier 1 — the Harbor starts at tier 2
  with a start-up grace + a guarded step back up; "real phones decide" recorded), the catch closed (the owner's iPhone), the wheel
  at night (crisp white bulbs + a glow ring on the rim), SIGNS OFF THE HERO TOWERS (the sunburst's sign + the HOTEL blade gone; THE
  GAME BLADE with chasing bulbs in the hotel's spot), the train decided (desktop + TV, Part 12).
- The sky (`core/harbor-sky.js` pure + tested; `screens/harbor/skyfx.js` + air / banner / smoke / birds / balloons / drones / moon):
  crafted AIRLINERS (liveries, a lit tail at night, nav lights, strobes, landing lights; contrails capped at 60 samples), THE BANNER
  PLANE (a Cub towing 1–3 rippling panels), SKYWRITING + SKYTYPING (smoke on the real wind; API + holidays only), THE HELICOPTER
  (rotor blur, a searchlight at night; the yacht-landing hook), GULLS / SWIFTS / GEESE / BATS / the heron, HOT AIR BALLOONS (calm clear
  mornings + summer evenings; the burner lighting the envelope at dusk; a rare festival), THE MOON (a real texture, its phase, earthshine,
  the amber moonrise in the sunrise corridor, the harvest moon, a supermoon, a halo only in haze, the red eclipse) + the golden haze,
  THE AURORA (the owner's call: ~2 seeded nights a month for everyone, never two in a row, + a bonus night on a real NOAA Kp ≥ 7 storm —
  Kp via `/api/sky`), THE DRONE SHOW (a barge, a rising swarm, letters / hearts / stars / flags / every game's mark / ₿ / holiday shapes,
  the flow between formations, home again — a heavy sky event) and THE HOLIDAY SKY TABLE (a message by day + a drone show at night on
  each holiday, on the clock; CITY CONTROL can cancel or override; never on regular party nights).

### ✅ CITY 2.0 — THE HARBOR, Part 5 of 12: THE HARBOR'S HERO PIECES (Oct 21, 2026) — `docs/harbor.md`
- THE FERRIS WHEEL (`screens/harbor/wheel.js`): real steel (two rims + their truss, crossing tension spokes, struts, the hub) turning
  on the real clock, 16 gondolas hanging level and swaying, bulbs on the rim + spokes + a star round the hub with a 48 s show
  (steady → a chase → rings pulsing out → a sparkle), colour schemes for the holidays + party nights; its A-frames stand on a new
  PIER PLATFORM (the owner's catch: the legs stuck out past the pier).
- THE PIER (baked): pilings + braces, planks, railings, the boarding plinth, a ticket booth, lamp posts lit at night (+ their columns
  in the water). THE LIGHTHOUSE: a crafted banded tower shaded to the real sun, the gallery, a glazed lantern, the copper dome, the
  rubble breakwater, the keeper's cottage; THE BEAM: two cones turning on the clock, a flare when one faces us, reflected, bright
  and wide in real fog; 3 taps spin it (Part 12's egg); the Halloween-green hook.
- THE BOATS (`core/harbor-boats.js`, pure + tested; `boats.js`): on the clock, never through the pier — Rosie (decks, twin stacks,
  her turning paddlewheel, bulb strings at night) docks beside the platform; the yellow water taxi zips across in front of the
  pier head; the tug at night; sailboats by day heeling in the real wind; the far boats phased against docked Rosie; wakes from
  each boat's own past path; reflections; running lights.
- The small fixes: the tagline rests with the dock (and comes back on a tap); two named ROOF SIGNS on the word towers (the owner's
  call: under the skyline limit, out of the sun corridors, the beacons on their frames, dimmed while the tower spells a word).
- THE ELEVATED TRAIN: size-checked and not built (7 pt cars under the signs, mostly hidden behind the wheel + Rosie) — the owner's
  choice of options in `docs/harbor.md`.

### ✅ CITY 2.0 — THE HARBOR, Part 1 of 12: foundation + blockout (Oct 20, 2026) — `docs/harbor.md`
- Rollback point: the tag `city-1.0` (ba51ee2), pushed. Everything new behind `?city=2` (never saved; a normal visit never loads a
  harbor file); title.js gains one import line + one gated line (+ `__district.harbor()`).
- The owner's decisions recorded in docs/harbor.md (the vision, the reference as the floor, the size rules, hero pieces, signs,
  holidays, sound, modes, future growth, the 12 parts). Asked before building: the mockup's towers rose 23–63 pt into the real
  tagline → the skyline is squeezed (tall towers shrink most, landmarks stay tallest, the freed sky is the sun's arch); a phone
  sideways shows the whole city smaller.
- `core/harbor-layout.js` (the projector, the camera per screen from the real sign + dock rects, the SIZE table, the squeeze, the
  sun gaps, the whole layout), `core/harbor-events.js` (lanes, events, the deterministic scheduler with budgets + rarity + heavy
  events, the `&force=demo` event), `screens/harbor/*` (createHarbor with the district's API, the district's sky modules reused,
  the chunked baker with two canvas sets + a crossfade + a per-tier memory budget, 13 layer modules in grey box with day / sunset /
  night tints, `&grid=1`, `&debug=1`).
- Perf: today's city at a party peak, 4× CPU: 8.9 ms of drawing a frame at tier 2 (the baseline); the Harbor 3–4.5 ms (budget 8).
  Baked layers 15.6 MB at 390×844 (budget 64). First visit profiled: 0.49 s cold (the target is met).
- Tests: `tests/harbor.test.mjs` (22: the projector, SIZE, the squeeze, every size's reserved zones + sizes, the sun gaps, the
  scheduler), `e2e-harbor.mjs` (16: load + flags, never saved, a normal visit, HOST / JOIN / the knock, perf, 20-cycle memory,
  hidden tab), `title-perf.mjs` (both cities, any scene, per tier); `shots.mjs --city 2 --safe --sizes harbor --crop stage` +
  party / snow scenes. Reviewed: six scenes × six sizes, two refine passes.

### ✅ CITY 2.0 — THE HARBOR, cleanup pass 1 (after Parts 1–4) (Oct 21, 2026) — `docs/harbor.md`
- Clean measurements A-B-B-A against the commit before Part 4 on a quiet machine (the table in docs/harbor.md); the full default-city
  title suite + the Harbor E2E + the unit suite.
- BATTERY + HEAT: the Harbor draws every other frame when nothing fast is on screen (30 fps; 20 under reduced motion) and is back
  at 60 the moment anything moves (a plane, birds, the party, rain, the neon booting, a bake, a tap; `wake(ms)` for later parts);
  hidden = a full stop, now including the title's own loops; the water keeps its rates on the clock; `hold(ms)` keeps the tier
  through the title's catch.
- THE CATCH: no dark frame in a 6× CPU screencast of either city, but City 2.0's premium sign cost a 50–70 ms repaint every frame
  of the catch's glow (24 blur filters on the hot spots + electrodes) — now gradient dots, zero long tasks, every time unchanged;
  THE NEON BUZZ: a crisp tick + the gas's buzz on each flicker of the warm-up and the morning fade (City 2.0, the SFX bus); a day
  bug fixed (the premium glints filled dark).
- The signs: the right side re-spaced into two even columns + a diagonal pair (the wall arithmetic: ~240 pt of wall for ~262 pt
  of signs — the owner asked which rule gives).
- The review of Parts 1–4: a billboard sprite leak, the stars' canvas, per-frame searchlight spots, the scheduler's replay in the
  first frame, dead code in seven files, a flaky tagline check, seven stale doc claims — fixed.
- Perf (4× CPU, A-B-B-A against the commit before Part 4; t2 / t1 / t0): day 4.4 / 3.5 / 2.4 · night 5.7 / 4.7 / 3.1 · golden 6.7 /
  4.7 / 3.7 · party 6.7 / 5.3 / 3.6 · the worst case 6.9 / 5.5 / 3.9 — within 8 / 6 / 4 everywhere (tier 0's worst case was 0.5 over:
  the spelled word is one sprite now). Tests: unit 411, `harbor.test.mjs` 45, `e2e-harbor.mjs` 43/43 (+ 3 battery checks),
  `e2e-title.mjs` 118/118 (the full default-city suite).

### ✅ CITY 2.0 — THE HARBOR, Part 4 of 12: THE WATER (+ Part 3 touch-ups) (Oct 21, 2026) — `docs/harbor.md`
- Behind `?city=2`. The owner's Part 3 review first: the neon outlines now FOLLOW THE DECO SHAPES (one bent tube a side climbing
  every setback and over the crown's steps, thin fins on the upper tiers — the cyan word towers read as stepped ziggurats); the
  icon signs ~21 pt (were 11–18) on calm walls and the billboard half as big again (66×32, a big stacked name) on the left; the
  busy centre cleared (no icon on the needle, the dome, the step tower, the hotel or behind the wheel) so the NEON NEEDLE leads;
  the construction tower's spot (wordV) kept free of signs.
- THE WATER (screens/harbor/water.js): the frame above the waterline — sky, skyline, lit windows, neon, beacons, searchlights,
  the quay lamps (now lit) — mirrored in perspective every other frame; a bright-pass smeared into light columns (high lights
  reach the near water, calm = short, wind = long + broken); rippled row by row on the REAL wind (glassy calm → choppy); Fresnel +
  depth (a mirror far, the water's own colour near: blue-green by day, orange at golden hour, black at night); wavelets; the sun's
  gold path when low, the moon's silver path at night (real place + phase, none behind real cloud), sun glints by day; the near
  edge lapping. Hooks: reflect() (the wheel + the lighthouse now; boats Part 5), light() (fireworks, Part 10), wake(), set().
- Perf (4× CPU, A-B-B-A against the previous commit; t2 / t1 / t0): night 5.7 / 4.6 / 3.5 · party 6.4 / 5.4 / 3.6 · the worst case
  6.9 / 5.8 / 4.5 (tier 0 was already over before Part 4) · golden 5.9 / 4.9 / 3.8 — the live water +1.1 ms at tier 2, +0.5–0.7 at
  tier 1 (its mirror re-read 10 a second; tier 1's LED facades still + no neon flutter; the quay lamps one sprite). The first
  commit's water cost +2.4–2.9 ms (party 8.7, worst case 8.8 — over budget), fixed the same day. Tests: `harbor.test.mjs` 45,
  `e2e-harbor.mjs` 40/40 (+ 9 water checks).

### ✅ CITY 2.0 — THE HARBOR, Part 3 of 12: NEON + SIGNS + BILLBOARDS + BUILDING NEON + THE NEON LOGO (Oct 21, 2026) — `docs/harbor.md`
- Behind `?city=2`. The owner's Part 2 review first: far + mid windows are fine irregular glitter; the word towers narrowed a
  little (pitch 1.1) and the lighthouse moved into the slot between them (both faces whole + uncovered at every phone size, tested;
  bolder, fuller, warmer letters on a darkened face); THE SCROLL (any length, a Times Square ticker); the tagline's 15 s start when
  the title appears; aircraft beacons on every tall top, blinking in sync (white strobe on the tallest by day).
- One crafted tube system (tubes.js: glass, near + wide gaussian glow, white-hot core, highlight, caps, clips; uneven light from
  core/tube-path.js) for the signs (signs.js: vertical + horizontal cabinets, icon signs, the HOTEL blade with chaser bulbs, JAZZ,
  two painted billboards with gooseneck lamps) and the NEON OUTLINES on the buildings (core/harbor-neon.js: heroes fully, the
  middle tier on its setbacks, faint threads far; ~8 colours in roles; the NEON NEEDLE; LED facades on the glass towers).
- The owner's call on the signs (asked): every game has a sign; 4 named spots on a phone get a new pick each night (never while
  lit), the rest are tube icons; a game list that changes just fills more or fewer spots. Desktop: 9 named + icons.
- Moments as hooks (`&force=neon-party`, `neon-flash&game=`, `neon-scheme&scheme=`), the premium NEON logo (glass wall, hot
  bends, dim electrodes, a highlight toward the sun, glints by day, ANCHORS for 11a–c: `&force=anchors`), every game's TUBE LOGO
  (ui/tube-logo.js; `tests/integration/logos-preview.html`).
- Tests: `harbor.test.mjs` 42, `e2e-harbor.mjs` 31; perf within 8 / 6 / 4 ms at every tier (4× CPU), the neon's sprites ~2 MB.

### ✅ CITY 2.0 — THE HARBOR, Part 2 of 12: THE SKYLINE (Oct 21, 2026) — `docs/harbor.md`
- Behind `?city=2`. The owner's iPhone review first: a recomposed skyline (the SUNBURST — the one gold crown — and the stepped
  EMPIRE dominant, the needle third, the middle tier in clusters, the bands low and packed, two glass towers far back); one
  squeeze for every phone (0.65; roomier phones keep more sky); the Ferris wheel moved onto its pier over open water (its legs
  ≥ 12 pt clear of the speakeasy, its deck ~10 pt under the roofline), Rosie and the boats re-spaced; the tagline fades 15 s in
  and stays gone (its band joins sky-low; a tagline slot for later parts).
- Review findings 1, 4, 5: corridors chosen against the whole silhouette, blocks clipped (not dropped) at them over a dense base,
  every building's window grid + a lit layer of its own.
- The facades crafted (stone, terracotta, brick near, glass; Deco piers + spandrels, setbacks, shadows from the real sun, glints;
  night silhouettes, floodlit crowns, beacons); the lit windows on City 1.0's exact timeline (glitter far, rooms near, TVs, a light
  switched off now and then); the golden-hour rays through the corridors; three crafted searchlights (`&force=searchlights`,
  dramatic in fog); words in the windows (a 5-row font, `spell()`, `&force=spell&text=2027`); the sun's + the moon's arches re-fit
  (opt-in fields in district/sun.js + fx.js, City 1.0 unchanged).
- Tests: `harbor.test.mjs` 36, `e2e-harbor.mjs` 23; perf within 8 / 6 / 4 ms at every tier (4× CPU); 22.9 MB of 64.

### ✅ CITY 2.0 — THE HARBOR, Part 1.5: foundation fixes (Oct 21, 2026) — `docs/harbor.md`
- Plumbing only, behind `?city=2`: review findings 2, 3, 6, 7, 8 fixed (1, 4, 5 → Part 2). No new visuals except the `&grid=1`
  lane rects; every Part 1 number and size kept.
- The scheduler is state (`createScheduler`): replayed once from the local midnight a day back, then advanced one slot at a time
  — the past is never re-decided, so a long event can't pop in mid-flight or vanish (the sliding window did, 5217 / 9000 samples
  in the review's contended case).
- A re-layout (tier step, resize, the sign's rects moving) never blanks the city: the stale baked layer keeps drawing (stretched
  after a size change) until the new bake swaps in and crossfades; bakes wait for a running crossfade.
- Lanes are places: `laneRects` (sky-high / sky-low split, water, road, promenade, the speakeasy's windows + rooftop), tested
  clear of the sign, the corner buttons and the dock at six sizes; a heavy event's `quiet` reaches the planes, birds, swifts and
  cars as `fs.density`.
- The landmark tiers are projected in the world (`y0` through `box()`); `city=2` survives `setUrlRoom` (refresh / rejoin).
- Tests: `tests/harbor.test.mjs` 27, `e2e-harbor.mjs` 20 (+ lanes vs the real sign, `setTier(1)` never blanks the stage, the URL
  keeps the flag); the default city's title `dock` + `flow` groups pass.

### ✅ THE STREET, Part 2: THE PEOPLE (Oct 21, 2026) — `docs/title.md`
- [x] The speakeasy's door (sconce, peephole, neon glass, doorman), visits, the resting hint, the party line + velvet rope
- [x] KNOCK on the door → JOIN (a real way in), never over the dock or the city's other taps
- [x] Pedestrians (alone, couples, dog walkers, at the bus stop), umbrellas in the rain, hoods + footprints in the snow
- [x] The cab hail, spray in the rain, the small hours' windows (a few kitchens before dawn), holiday figures
- [x] Perf: streaks 9 → 6 bands; baked leaves, lamp light, canopy tints, door; draw-cost yardstick (`__district.cost()`)
- [x] Fixed: Part 1's street hidden while a blade sign was pending
- [x] Tests: people.test.mjs (6), e2e-people.mjs (21), e2e-title "knock" (16)

### ✅ THE STREET, Part 1 (Oct 20, 2026) — `docs/title.md`
- [x] Seeded layout clear of the blade signs: lamps, trees beside their own lamps, the shelter, the stop light(s), the door spot
- [x] Trees through the year (core/trees.js): leaf-out, the Easter cherry, summer, autumn turning per tree, Thanksgiving shedding, winter lights
- [x] Wind sway + gusts, leaves falling only from the trees, piles and scattered leaves; fx.js's screen-wide leaves/petals/fireflies removed
- [x] Buses (timetable, the stop, the owl, the party bus), the stop light + queues, car kinds, snowplows, golden-hour shadows
- [x] The street's party night: lamps into the party colours, breathing, the chase, the midnight sequence
- [x] Tests: street.test.mjs (10), e2e-street.mjs; shots.mjs street scenes + the street crop
- Part 2 (next): THE SPEAKEASY'S DOOR, the cab hail

### ✅ RAINBOWS (Oct 20, 2026) — `docs/title.md`
- [x] /api/sky: the past two hours of 15-minute precipitation → wetAt (when the rain really stopped); the device remembers it
- [x] One appearance per rain (2–7 min after, 1–2 min in, 10–20 min, 2 min out), seeded so the area's phones agree
- [x] The day bow (low sun, real colour order, supernumerary, sometimes a secondary + Alexander's band, a hole around the sun),
      the moonbow (bright moon), the neon bow on party nights (six tubes, clips, sputter on, breathing, power off, street light)
- [x] Phone: under the tagline, ends behind the towers; desktop: over the sign; Reduced effects; previews &force=… and &rained=
- [x] Tests: rainbow.test.mjs (7), server.test.mjs (+1), e2e-rainbow.mjs

### ✅ PARTY NIGHTS (Oct 20, 2026) — `docs/title.md`
- [x] Fri / Sat 8 pm → 2 am (from the catch), warm-up → peak → after hours; the late-night wind-down waits until 2 am
- [x] The beat: a clock that eases from a slow breath onto the song (this phone's, or the room's in a lobby) and back
- [x] The logo's bloom, SPEAKEASY as neon with a shimmer, the rings, the trims rippling, a quarter of the windows in party
      colours with whole floors, neon volumetric searchlights sweeping with the music, the start wave, the 2 am wind-down
- [x] The midnight finale on a new fireworks renderer (NYE and the Fourth ride on it too), its light on the city, its sound
- [x] More traffic with neon underglow; holiday palettes; Reduced effects calm; tiers simplify; the lobby backdrop breathes
- [x] Tests: party.test.mjs, e2e-party.mjs (36 checks + videos / screenshots)

### ✅ THE FLANK + the title's corner buttons + the lobby song (Oct 20, 2026) — `docs/title.md`, `docs/audio.md`
- [x] The new dock: [ JOIN ring ] [ glass pill: BOARD · GAMES · YOU ] [ HOST ring ] — two identical rings mirrored round a compact
      pill of three icons; HOST in the sign's colours, JOIN white neon all year; both always lit, never sputter
- [x] The title's ☰ and music buttons in the pill's glass with white neon tube icons, lit with the sign's tubes (title only)
- [x] The host's song carries on into the room (the queue seeded at its place); joiners crossfade in; the same song never restarts
- [x] Tests: e2e-title (the Flank, white JOIN, the corner buttons), lobby-song.test.mjs, e2e-lobbysong.mjs (9 checks)

### ✅ Phones: THE BIG ARCH in step with the real sky (Oct 20, 2026) — `docs/title.md` (THE REAL SUN)
- [x] Height follows the real elevation: peeks over the rooftops at the real sunrise, fully behind them at the real sunset, never
      hidden once the sun is ~4° up; a fitted two-piece curve keeps it climbing all morning; the rainbow shape stays round
- [x] The neon catch at the real sunset (within seconds), the morning goodbye 5–25 min after sunrise; tall edge towers move the
      ends inward (symmetric) or lift the top (real timing wins)
- [x] `&at=lat,lon` preview location; tests: four skylines × three cities × three dates

### ✅ Phones: THE SUN'S BIG ARCH (Oct 20, 2026) — `docs/title.md` (THE REAL SUN)
- [x] One rainbow over the whole sky: up from below the far-left rooftops, over the top, down behind the far-right towers;
      position = the real day (`sunArc` u), the top behind SPEAKEASY at a summer noon and at the tagline at a winter one
- [x] Behind buildings at both ends and wherever it lines up with a tower; behind the words (never the NEON letters), which keep
      a soft dark edge while it's there; never near the corner buttons; desktop unchanged
- [x] THE NEON COMES ALIVE follows the drawn arch (a tower it dips behind never fires the catch early); &speed= previews glide
- [x] Tests: sun.test.mjs (the arch at many dates, north + south), neon.test.mjs (the tall-tower case), e2e-sky (noon behind the word)

### ✅ HUSH WORDS (Oct 19, 2026) — `docs/content.md`, `docs/data-model.md`
- [x] Room codes are common 4-letter words: 798 hand-curated (no homophones, nothing rude / gloomy / tricky to spell), built and
      checked by `scripts/build-hushwords.mjs`; a word rests 24 h after its room closes (`hush/`), claimed by a transaction
- [x] JOIN accepts any 4 letters (I and O too); old random-code rooms and their invite links keep working until they close
- [x] LOCK THE DOOR (host, lobby): no new players; anyone already inside rejoins; enforced in the rules
- [x] The lobby's password card; "HUSH WORD" everywhere; share text "Get in here — the hush word is MINT"; a light guessing guard
- [x] Tests: hush.test.mjs, rules (lock, claim race, hush/ abuse), e2e-hush.mjs (22 checks)

### ✅ THE NEON COMES ALIVE (Oct 19, 2026) — `docs/title.md`
- [x] The sign sputters to life through the golden hour (silent, seeded, growing, letters sticking) and catches — the only sound —
      when the sun's drawn disc goes behind the rooftops; the city signs answer one at a time; never the weather
- [x] Mornings: the city signs go first in the dawn twilight, then the logo falters and dies letter by letter after the disc clears
      the rooftops; the dock follows (icons dark through the ramp, HOST never sputters)
- [x] Opening mid-way shows the right stage; the intro adapts; ALWAYS NIGHT; Reduced effects fade; &speed=60 fast-forward (test-only)
- [x] Tests: neon.test.mjs + e2e-title (13 checks)

### ✅ Mobile skyline + the sun's low arc (Oct 19, 2026) — `docs/title.md`
- [x] Portrait phones: the street comes down to just above the dock, the rooftops only a little — taller towers, a valley skyline
- [x] The sun's phone path: across the open band under the tagline (higher in summer), rising out of / setting into the side towers;
      never near the corner buttons; the moon unchanged; desktop unchanged
- [x] The dock's icons are tubes of the same sign (on with the power-on / dusk, off at dawn, empty glass by day)

### ✅ THE NEON RING — the title's dock (Oct 19, 2026) — `docs/title.md`
- [x] One floating smoked-glass tab bar replaces HOST / JOIN, THE BOARD / GAMES and the welcome line: JOIN · BOARD · [HOST] · GAMES · YOU
- [x] Custom neon line icons (door, trophy, tiles) and YOU as the player's own emblem (a neutral one before a profile)
- [x] HOST: a raised dark-glass disc in a cradle, a neon tube ring in the sign's own colours (every holiday by itself; four tubes on
      a multi-colour sign; blends), always lit (softer by day), flickering on with the letters, breathing, reflected on the street
- [x] JOIN: a glass panel above the bar (all the code-box behaviour; closes by JOIN / outside / swipe / Escape; above the iOS
      keyboard); REJOIN and notes float above the bar; the bar never moves; no blur on the lowest tier
- [x] Tests: e2e-title "THE NEON RING" section (19 checks)

### ✅ THE REAL SUN (Oct 19, 2026) — `docs/title.md`, `district/sun.js`
- [x] Rises left at the real sunrise, sets right at the real sunset (mirrored in the south), real height by season, framed into the
      open sky: never across the sign, the tagline, the corner buttons or the dock; phones: beside / above the sign like the moon
- [x] Colour and size by elevation (red-orange, large, squashed at the horizon → warm white), cached disc + bloom, no flare
- [x] Sunrise / sunset behind the skyline with a halo; warm rim light and gold window glints on the sun-facing side; faint golden-hour beams
- [x] Thin cloud glows, overcast hides it (a brighter patch), none in rain / heavy fog
- [x] Real solar eclipses from the geometry (Meeus lunar series, topocentric): partial crescents, totality with a corona and a dark sky
- [x] Preview: `&force=eclipse-sun,totality`; tests: sun.test.mjs + e2e-sky.mjs (incl. 60 fps at golden hour, 4× CPU)

### ✅ AIR TRAFFIC + SATELLITES (Oct 19, 2026) — `docs/title.md`, `district/aircraft.js`
- [x] The old flying light streaks and the old satellite train removed
- [x] Simulated planes by the local hour (busiest evenings, very rare 2–5 am, minutes apart), never level, at their own heights
      and speeds, behind the clouds and the skyline, never across the sign / tagline / dock (on phones: the strip above the sign)
- [x] Night: red / green nav lights correct for the direction, a double-flash strobe, a red beacon; approach planes with landing
      lights; sunset / dawn silhouettes and day glints with contrails that spread and fade; rain / fog / overcast respected
- [x] Satellites only in twilight on clear skies: single faint points; a Starlink train on about one evening in four or five
      (seeded by date), fading into the earth's shadow; Reduced effects: fewer planes, steady lights
- [x] Preview: `&force=planes,approach,satellites,sat`; tests: aircraft.test.mjs + e2e-sky.mjs (incl. 60 fps at 4× CPU)
- [x] Fix (iPhone): high planes were dark specks on the deep blue — now sunlit silver by day, larger on phones; every path kept
      above the real rooftops (low ones used to slip behind the side towers)

### ✅ LIVE WEATHER + the city's life (Oct 19, 2026) — `docs/title.md`
- [x] Real local weather: `/api/sky` (Vercel IP location, rounded ~35 miles, Open-Meteo, 15-min cache per area); the sun, moon and
      stars from the real place; the seeded fake rain removed (no weather = a dry city)
- [x] Clouds (noise shapes, light from above and from the city below, an overcast deck), rain in depth with wind, splashes and
      rings, storms (sky flashes, bolts, every drop lit, the glass flickers, synthesized thunder), fog banks, real snow settling
      on roofs and the sign's tubes, a first-snow hush; a deep freeze (frost ferns at the screen's edges, icicles, rime, frosted
      windows) on really cold days
- [x] HOST / JOIN glass takes the sky's light; rain on the glass
- [x] Birds: geese V's in the migrations, summer swifts, rooftop pigeons (tap: they scatter and come back), a rare heron
- [x] The street: traffic by the clock (rush hours), an elevated train, steam on cold days
- [x] The planets in their real places, real lunar eclipses (a blood moon); the sign by day as empty glass tubes; the two
      blade signs never the same colour; the sign's day flicker no longer leaves letters lit
- [ ] Recorded thunder / rain (the owner may supply royalty-free files: `RECORDED` in ambience.js)

### ✅ Safety net (Oct 19, 2026) — from the project review's top items (`docs/testing.md`, `docs/profiles.md`, `docs/audio.md`)
- [x] **Errors from phones:** js/errlog.js → `POST /api/log` → grouped `errlog/` entries → "Errors from phones" on /admin (count,
      devices, browsers, screen, build, stack; clear one / all; 30-day prune). Noise filtered, no ids sent, rate-limited
- [x] **GitHub checks** on every push (unit, rules, /api, smoke on the emulators) — next to the deploy, never blocking it
- [x] **Fresh data after a deploy:** `/data` revalidates on every load like the code (was: cached up to a day + a week stale)
- [x] **Lighter first visit:** the twelve game stylesheets + the match kit's load with their game (index.html links 7 sheets, was 20),
      in the old cascade order; shared animations and helpers moved to components.css (five keyframes lived in cipher/signal and
      would have stopped animating OVERCLOCK, BLUFF and DOUBLE AGENT). NEON PAR's stray `.gc-name` rule no longer shrinks the
      lobby's game names (17 px as designed, scaling down on narrow phones). `e2e-loading.mjs`
- [x] **Admin STATS:** live now (players in rooms, rooms, games in progress), games played (week / 30 days / all time, avg
      players), matches per day, most active players (week / all time / XP), new + returning players, busiest times heatmap
- [x] Admin on phones scrolls (it inherited the game screens' page lock); TODAY in games played, most active players and the players box
- [ ] Next from the review: a real-phone night (6–8 phones incl. an old Android / Low Power Mode) and a look at the Firebase plan's
      connection limit (Spark: 100 at once ≈ 12 full rooms)

### ✅ Stage 14 — RUMRUNNER (Prohibition trading, the city diorama) (Oct 2026) — `docs/rum.md`
- [x] Rules first: six goods × six districts with tendencies, seeded daily prices, news spikes / crashes, rumours (70 % true),
      weather with effects, a shared market moved by everyone's trades, Balboni's compounding debt and his collectors, the stash,
      six upgrades, tip-offs, the feds / hijackers / lucky finds with pre-rolled dice; a whole day replayed from a private log;
      whole-match tests at every length, the server replaying the whole city from the books (`verifyDays`)
- [x] Host picks 15 / 20 / 30 days and a 30 / 45 / 60 s day; the day ends early when everyone's DONE; rejoin re-reads your
      logs; host migration repeats the night; late joiners watch
- [x] The city: a three.js diorama (instanced buildings, towers, signs, lamps, cranes, trains, mansions, searchlights, rain, fog,
      lightning, the dawn of the last morning), trucks in player colours driving at dawn, the camera swooping into events; a
      deco-gold glass UI: market cards with trends, BUY / SELL drawers, Balboni's office with typed dialogue, the stash, the garage,
      travel + TIP OFF; dawn / night cards; THE NEON GAZETTE drawn on canvas (saveable); the podium + THE LEDGER
- [x] Music: the owner's run1–4 (calm pair first, then the driving pair, seeded per room), ducking for events, victory.mp3;
      rain / thunder / city / engine ambience, siren, register, typewriter, printing press, jazz stings
- [x] THE BOARD: BIGGEST FORTUNE per length (15 / 20 / 30 days), wins; the economy simulator `scripts/sim-rum.mjs`
- [x] **The rules file changed: re-publish `database.rules.json` in the Firebase console.**

### ✅ Stage 13 — HIGH STAKES (wager trivia, the signature room) (Oct 2026) — `docs/stakes.md`
- [x] Rules first: chips, bets (min 10 % / at least 10, max all in, timeout = the minimum), payouts (MEDIUM 1×, HARD 2×, DOUBLE DOWN
      rounds 4 and 8 ×2), house loans (200, repeatable, subtracted at the end), ties by total answer time, ALL IN last-to-first —
      all derived from the round results; whole-match tests with 2 and 8 players and a host replay
- [x] Questions: Open Trivia DB (session token, batches of 50, rate-limited) → The Trivia API → the bundled bank; MEDIUM and HARD only;
      eleven table categories, never the same one twice in a row; a seeded difficulty plan, the final always HARD; obfuscated in the room
- [x] Hidden bets and answers in a top-level node only their owner reads (the host only from the showdown on); public lock flags;
      rules tests; rejoin restores your locked bet and answer; host migration in every phase; late joiners watch
- [x] The back room: a baked Canvas 2D room (frosted-glass neon, emerald felt with a woven texture and printed gold, a polished rail),
      the lamp's warm pool and sway, haze in the lamplight, chips flying in weighted arcs, the 3D gold-foil category card, the cream
      and gold question card, a bet dock with a chip slider and draggable chips, showdown cards flipping in sequence, DOUBLE DOWN flare +
      gold sweep, ALL IN darkness and a spotlight, the winner's slow chip rain; quality tiers; reduced effects
- [x] Music: the owner's high1–3 (seeded per room, crossfading), ducking for showdowns, near-silence for ALL IN, victory.mp3 on the
      podium (a new per-game `FINAL_MUSIC`); tactile synth SFX (chip clacks, stacks, flip, lock, chime, slide, accent, drone, tick)
- [x] THE BOARD: best final stack and biggest single hand (records), wins (career), every round replayed by the server
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


### ✅ CITY 2.0 — PROMENADE FINAL TOUCHES (Oct 24, 2026) — `docs/harbor.md#pf`, `docs/audio.md` (FP3 + THE SKY SOUNDS) (the owner on FP2: the promenade is filled out — lock its final layout)
- **The cloud test job** (`.github/workflows/harbor.yml`): the whole e2e-harbor suite on GitHub after a City 2.0 push (≈ 7–9 min; a newer push cancels; cached); its slow-machine flakes made to wait for their conditions.
- **The final layout:** the cart HIDDEN (`CART_SHOWN`, back in 8b), the bench + a bigger crabapple just left of the crossing (the DOUBLE AGENT blade free), the tall lamps a matched pair FLANKING the crossing, the globes at the front corners, a 1920s OLIVE-GREEN PILLAR MAILBOX by the right curb.
- **The centrepiece:** a flush BRICK COMPASS-ROSE INLAY (red + buff + dark brick, worn where feet go, lit by the pools) + an EVENT LIGHTING RIG (four flush brass floor spots, `harbor().centrepiece.set()` for 11a–c, `&force=centrepiece-test`: a lit obelisk).
- **The light:** the pools re-baked for the new lamps (people readable everywhere — the bench, the inlay, the door, the lobby line's corner); warm UPLIGHTS in every tree grate (the trunk + the crown's underside glow, the top fades out).
- **The speakeasy corner + the street:** the street under the dock TARRED setts + tar joints + a clear curb step; the string lights OFF until 7b; the blade's lamps concentrated (even face, the name pops), the billboard's a step brighter.
- **Sound:** the car's sound placed on the clock (its peak on the car's mid-crossing, prefetched, panned — it came 5–6 s late); THE SKY SOUNDS (12 files → 16 takes, 3.2 MB) wired to the helicopter, airliners, banner plane, geese, drone show, balloons (UFO / TR-3B / jets filled for 6b).
- Neon by depth verified at 402 (normal + party): clean.

### ✅ CITY 2.0 — FOREGROUND POLISH 2 (Oct 24, 2026) — `docs/harbor.md#fp2`, `docs/audio.md#fp2` (the owner on FP: "a big jump", ~8 / 10)
- [x] The beat after returning: the lead RE-MEASURED on every resume / rebuild / page return / route change + on a SKEW alone (`leadRefresh`, `leadKick`); +100–146 ms in ~10 kicks; the readout shows it converging
- [x] The promenade: the corner maple + the urn removed; the medallion at 273 pt (in front of the crossing) + `centrepieceCap`; the cart at 213 + `L.cart.route` / `stopX` / `EVENT_CLEAR` (8b); the bench at 158 under a FLOWERING CRABAPPLE; the parked bus + cars off (`PARKED_TRAFFIC`); the lantern on a far kerb + a cast-iron post; the framing maple rebuilt (`deepen`, a bounce light, five limbs, a fuller crown)
- [x] The cobbles at night: a packed-sand grout lit by the pools, soft rounded stones (`street.js#paintSett`, shared with the street)
- [x] THE STREET UNDER THE DOCK (full-bleed): gutter, setts, a streetcar track, a manhole, a drain, the season in the gutter, a wet hook (`streetWet`); a 1928 Tudor sedan in five paints crossing it on the implied road's clock while the dock rests (`motorcar.js`, `carAt`, `carVis`)
- [x] CRISP LIGHTS: the pole's + the shop lamp's + the sconce's clouds → a core, a tight halo, light landing (baked); tighter halos on the lamps + the cart (`POLE_HALO`, `SHOP_GLOW`, `LAMP_HALO`)
- [x] THE BARBER POLE: LED cool white; per-device-pixel analytic stripes placed 1 : 1, the phase a pure function of time (the jitter's likely cause: a downsampled texture); party nights magenta / electric blue / gold with a gentle punch
- [x] PARTY TIMING: 8:30 warm-up / 9:30 peak / calming after 1 am, both after tonight's power-up (`harborPartyPlan`, `partyReadyHour`); the party music from the warm-up
- [x] NEON BY DEPTH (the owner's add-on): `DEPTH_HUE` 60°, the pairs by contact + "directly behind", `fixDepth`, `partyPlan` on the hue ring, the keyline gap (`eraseFront`), near / far ±6 % — 10 → 0 city clashes, 18 → 0 party clashes at 402
- [x] Tests: harbor.test 131 → 144, the unit suite 539; e2e-harbor groups party, music, promenade, core, speakeasy, neon (all green); the smoke check 3 / 3

### ✅ CITY 2.0 — FOREGROUND POLISH (Oct 23, 2026) — `docs/harbor.md#fp`, `docs/audio.md#fp`
- [x] §0 the beat after returning: a pure SONG CLOCK on the element's currentTime (re-anchored on every element event, visibility, rebuild; > 30 ms drift), the song's own bar + beat + `drift` on the readout, the HEARD OFFSET (`SKEW`: the kicks ignored, never applied)
- [x] The promenade re-layout: the back row (maple · tall lamp · maple + bench · [the crossing] · tall lamp), the open floor (the medallion, the cart, the corner urn), the front edge (two corner globes + the framing maple); the sketch's curb planter + the phone's crabapple dropped (hidden / not in the row)
- [x] THE URN (a Deco cream-terracotta urn: gadroons, chevron frieze, rolled lip, lathe shading; thriller / fillers / spillers by the season); the night light plan (wider cool pools, the cart's glow, a bounce light on the props); the blade baked after the trees beside it
- [x] The billboard on a short dark frame (⅛ open, its foot 3.4 pt over the string lights); the barber pole a helix strip slid sub-pixel (60 = 30 Hz), white + the hero light, the sconce + the shop lamp softer; the blade dimmer at night
- [x] The stop lights side-on (two-way 1920s heads), the WALK / WAIT lantern across the road, one 46 s cycle on the city's clock (`signalAt`)
- [x] Sounds: the water 0.07 + a 1.6 kHz low-pass (≈ −9.8 dB), the bed × 0.71 under the music + waiting for the song, varied gull runs, cars 0.1; PULSE_DEFAULT 1.75; the panel's TOOLS: READOUT + AUDIO PANEL (`js/ui/debug-tools.js`)
- [x] Tests: harbor.test 131, city-sounds, e2e-harbor 260 / 261 (the water seam on its limit — docs/harbor.md#fp), unit 525, smoke 3 / 3; two review passes (402 noon / golden / night / party, the corner, 390 + 430); A/B perf same

### ✅ CITY 2.0 — PART 8a: THE PROMENADE'S LOOK (Oct 23, 2026) — `docs/harbor.md#part-8a`, `docs/audio.md#the-city-sounds`
- [x] Section 0: the billboard onto the speakeasy's roof (its own baked group, a dunnage platform so its feet show over the parapet); the blade's name bigger (taller board, wide letters, the two-word split fixed); the corner-turn preview removed
- [x] The first-tap surge whenever the NEON sign is off (`neon-ramp.js#firstTapAnswer`); the pulse after returning (a frame-loop watchdog, `pulse` on the readout, the AUDIO panel's `city` row); PULSE STRENGTH 50–250 % (default 130 %); the neon tap sounds × 0.75
- [x] THE CITY SOUNDS: 65 named slots (`core/city-sounds.js`), the player (`audio/city-sound.js`), the events wired (`screens/harbor/sounds.js`), `scripts/add-city-sfx.py`, the panel's SOUNDS; water-lapping, city-hum-day / -night, car-1920s-pass (4 takes), gulls (4 takes) imported (church bells + rumbles cut, levels by analysis)
- [x] The grey-box stop ×2 (the owner: people ~⅔ of the door, the lower middle filled, autumn by the real date, the flag removed, the stop lights off the wheel; the medallion into the open plaza, the left globe dropped)
- [x] `core/harbor-promenade.js` (the bands, the sizes, the phone's layout by screen fraction, the season, the implied road's passes on the clock, the walkable zones); SIZE.person 20 → 27 pt
- [x] The ground (setts, pavers, the front curb, asphalt), the lamps' pools baked at the lamps' ramp, crafted Deco lamps + their lit glass, shadows along the real sun; the trees (`core/harbor-trees.js`, `trees.js`, falling leaves); the props (`props.js`); the implied road (`roadlight.js`, the car sound, `harbor().road.wash` for the raid)
- [x] The panel's PROMENADE category (four seasons, the implied road off, a car passing); `&season=`, `&force=no-lamp-light`
- [x] Tests: harbor.test (+ the billboard, the promenade, the seasons, the passes, the trees, the props, the slots), e2e-harbor `promenade` + `sounds` + `music` §10; three review passes (402 day / golden / night / party, the seasons, 390 / 430 / desktop); the A/B perf: same

### ✅ CITY 2.0 — PART 7a: THE SPEAKEASY'S LOOK (Oct 23, 2026) — `docs/harbor.md#part-7a`, `docs/audio.md#7a`, `docs/title.md`
- [x] §0 the layout: corner buttons 36 pt (44 pt tap areas) everywhere, the corners split on the title + the lobby (☰ left, ♪ right), the
      NEON sign ~24 pt higher (both cities), the lanes clear of the ☰
- [x] §0 the music's first tap: the NEON sign's surge by day / a brighter race at night, once a visit, only when the music really starts
- [x] §0 the beat after returning: the frozen analyser ignored, the direct element's grid drives the lights (`direct-grid` / `tempo`); the
      pulse a step stronger; every sign's spell-on in turn (+ `&force=spell-on`); the AUDIO panel's header = its detail
- [x] §0 the preview panel in collapsible categories (+ the corner turn, the first tap, the spell-on, SUNRISE / SUNSET, the word towers' text box)
- [x] §1 the speakeasy (core/harbor-speakeasy.js + speakeasy.js): walls painted flat + projected, the Deco facade, the barbershop, the rooms
      by the hour, the barber pole (lit + slow at night; a raid hook), the rooftop + mounted string lights, a 'front' bake for the front row
- [x] §1 the ghost ad: weekly (never doubling tonight's billboard); the turned corner (≥ 70 pt) as a preview — it hides the wheel's leg + pier,
      so the default is the plan's fallback (3): a painted blade sign with two lamps; the owner decides
- [x] §2 the near brick snapped to device pixels (the bake was already at DPR 2), quoins, soldier courses, cornices, returns in shade; the
      lighthouse by day as a lit cylinder (masonry, rust, a stone plinth); the sun's colour by altitude (+ the morning city warmer)
- [x] three refine passes (day + night at 402, 390 / 430 / 1440), harbor.test + e2e-harbor (+ the speakeasy group), the A/B, docs

### ✅ THE iPHONE MUSIC BUG, M4 (Oct 23, 2026) — `docs/audio.md#m4` (the owner's iPhone after M3, with the AUDIO panel's evidence)
- [x] The evidence read: every NEW context made inside a real tap says `running` (resume ok) and its clock never leaves 0.00 while the song
      element plays on and the probe hears nothing (six rebuilds, none started) = a started output unit never called: the AVAudioSession
      inactive — the page set `audioSession.type = 'ambient'` (deactivated in the background, re-activated for an element, not for Web Audio)
- [x] The fix: `'playback'` while the music is on (plays with the silent switch on, like YouTube in Safari; stops other apps' music),
      `'ambient'` off / muted — set before the context, re-asserted in every tap / back on screen / statechange / settings
- [x] THE DIRECT PATH: a plain `<audio>` element (never in the graph) takes the song at its place when the graph is dead — at once if armed,
      else in the tap; muted by mute / MUSIC OFF; the beat on the grid; back onto a voice at a tap once a context's clock has run 2 s
- [x] Frozen seen in 0.7 s for a context that never started and at the tap itself; a rebuilt context that froze is not rebuilt again for 20 s
      (the loop that cost 5–6 % slow frames); the old context closed first; the contexts alive counted; a refused `new AudioContext` logged;
      a fade on a stopped clock sets the value straight; the voices + the direct element re-armed in every tap; hiding the page no longer
      aborts a pending activation
- [x] The AUDIO panel: `alive`, the session type set (when, why), the output path (`WEB AUDIO` / `DIRECT ELEMENT`), `DIRECT` in the title,
      repaints only on change
- [x] The preview panel's MUSIC row says where the mood comes from (the phone's MUSIC MOOD setting was forcing MORNING all day); AUTO +
      CLEAR ALL put that setting back to AUTO
- [x] e2e-harbor music §8 THE EVIDENCE (the frozen fresh contexts + the session, emulated) + §7 reworked: 76/76; audio-resume; smoke;
      units 491. e2e-lobbysong's STUCK check fails the same on the previous commit (Known issues)

### ✅ CITY 2.0 — FIX PASS M3 (Oct 23, 2026) — `docs/harbor.md#m3-fix-pass`, `docs/audio.md#m3` (the owner's iPhone: the music still dies; the billboard dark; the brick flat; the small clouds cheap)
- [x] The music bug made visible: THE AUDIO PANEL (`&debug=1`, both cities, any screen — the context + its clock, the song element, what should
      play, the last 8 events with times: visibility, page show / hide, taps, every resume + play with its result or error)
- [x] Reproduced on this machine by emulating iOS's gesture rule in e2e-harbor (M2 failed 3 of 3), then fixed: gestures = touchend / click /
      keydown (a touch's pointerdown isn't one), the song started inside the tap, interrupted / frozen / unhonoured contexts rebuilt at once,
      re-arming refused voices, every silent tap rescues, the music button rescues in its own click
- [x] The learned lead: sign right (a test), only strong kicks within ±80 ms of a beat, clamped −80…+120 ms, the listener's lag follows the
      frame rate, heard kicks released when heard; the readout shows the lag
- [x] The billboard lit all night: the lamps wash the whole board (LAMP_DIM 0.5 → 0.1); `shots.mjs --crop bill`
- [x] Brick at noon: courses, mortar, a soot band, lintels + sills (baked, by the sun's height); the small cumulus dropped / broken fragments +
      wisps (≤ 4), near small ones grown to heaps, soft scud melting into the deck
- [x] harbor.test 105, units 491, e2e-harbor music §7, e2e-lobbysong, audio-resume, smoke

### ✅ CITY 2.0 — MUSIC FIXES + DAY BUILDINGS (Oct 23, 2026) — `docs/harbor.md#m2`, `docs/audio.md` (the owner: the music dies after leaving Safari; the day "a little flat")
- [x] City 2.0's EVENING without City 1.0's slip8 (the importer skips it for good; `--reuse` refuses City 1.0 songs); a unit test
- [x] THE MUSIC COMES BACK (both cities): every resume checked after 1.5 s, a stuck context REBUILT in the next tap (music re-made in the same
      tap, the lobby's song re-placed on the room clock, PULSE's clock re-sampled, the SFX chain rebuilt); errored / stalled songs reloaded at
      their place (never "missing" unless a 404); a dead voice seen by a probe; bfcache + the iOS audio session; the music button means PLAY
      when the music should be on but isn't
- [x] The beat as heard: Safari's missing `outputLatency` (the output timestamp / ~20 ms), each phone measures its song element's lead from the
      kicks on trusted grids (Chrome: 2 ms); the readout's `sync` line; party3 re-checked (stays untrusted: syncopated kicks)
- [x] Day buildings: cast shadows between buildings along the sun (both baked groups, multiplied blue-violet, soft, lazy per wall), contact +
      foot occlusion, recessed windows, rusticated bases, brick batches, belt courses, a warm facade gradient, brighter sunlit sides
- [x] The billboard's gooseneck lamps: ~6–8 pt enamel shades on clear curved arms, a bulb + a cone of light when lit, never over the mark / name
- [x] pixdiff (night / party / dusk / golden = the lamps only), harbor.test 104, city-music 16, e2e-harbor 169/169, e2e-lobbysong 12/12,
      audio-resume, smoke, units 490; perf A/B `np-day` / `np-night` / `np-party`: same

### ✅ CITY 2.0 — SKY POLISH (Oct 23, 2026) — `docs/harbor.md#sp` (the owner: the clouds a 7/10)
- [x] CIRRUS drawn as groups of wisps (fibratus, mares' tails, tufts) over a soft body, never straight / parallel / evenly spaced; a
      cirrostratus veil on a hazy high day; lit first + last at sunset; above the tagline's band; `&wx=cirrus|veil` + the panel
- [x] The cumulus: soft uneven bases with rounded ends, lighter at the edges; the self-shadow on a smooth thickness field (no seams);
      towers + fractus; stratocumulus as one lumpy mass
- [x] Overcast: only scud in front of the deck; the city's light flat + cool-grey by day (`sunLook.ovc`, `faces`)
- [x] The moon: a wide gaussian glow; the 22° halo only under a veil, faint, never across the words; the Harbor's sun near-white from ~9°
- [x] Beams + searchlights meet the clouds (`rayHit` / `beamPatch`, masked by the cloud's sprite, cached); the cloudy party's cost:
      no re-light at birth, none by moonlight, the per-frame column scan gone
- [x] Contrails: one smooth trail of puffs on a fixed time grid (no steps at 60 / 30 Hz), a steady head
- [x] Buildings by day one small step; pixdiff (`night-nc`, `dusk-nc` identical; `golden-nc` the sun only); harbor.test 102,
      e2e-harbor 112/112, units 472, smoke; perf A/B `np-pclouds` / `np-clouds` / `np-party`: same

### ✅ CITY 2.0 — THE DAY LOOK (Oct 23, 2026) — `docs/harbor.md#dt2` (Day touch-up part 2)
- [x] THE CLOUDS, a full rework: `core/harbor-clouds.js` (PURE + tested: the kinds from the real weather + the cover by height,
      the perspective layout with clusters and the row rule, the light for the hour + per cloud) + `screens/harbor/clouds.js`
      (cumulus as smooth unions of billowed 3D lobes, stratocumulus as merged heaps, altocumulus + the overcast deck as perspective
      noise fields, cirrus as drawn filaments; per-pixel light with a self-shadow march, hue-keeping highlights; shapes cached,
      re-lit in time slices, crossfaded); the sky beams catch them; `tests/integration/clouds-preview.html` + `shots.mjs --page`
- [x] The buildings by day: warmer lit sides, deeper blue-violet shade, a firmer side by day, crisp arrises + cool corner lines,
      brighter ledges, deeper setback + cast shadows, stronger aerial perspective, a deeper day horizon, the gold crown in the sun,
      glass mirroring the clouds (broken at the mullions), richer copper
- [x] Windows by day: per-building character (office ribbons, apartments with curtains + blinds + transoms, tall Deco windows),
      varied reflections pane by pane, tone bands far away — the lit layer's panes unchanged
- [x] pixdiff: `dusk` + the no-cloud twins (`night-nc`, `party-nc`, `dusk-nc`, `golden-nc`) — the night, the party, the blue hour
      and golden hour unchanged except the clouds

### ✅ CITY 2.0 — THE LIGHTS + SIGNS PASS (Oct 23, 2026) — `docs/harbor.md#dt1` (Day touch-up part 1)
- [x] THE BLUE-HOUR POWER-UP on the one darkness input: the dusk curve on the sun's elevation (golden hour's flat 0.35 gone), the
      power-up sunset → −7° with tonight's seeded order (outlines cluster by cluster in a sweep, signs one by one), the ramps re-cut
      (the billboard's lamps first, the lamps at sunset, floodlights mid blue hour), the windows (~5 % in golden hour, lower floors
      first, all by the blue hour's end), the BLUE HOUR look (a deep-blue sky, night tones) — City 1.0 untouched; mirrored at dawn
- [x] Floodlights: the wheel backdrop's gold roof accent, the wall behind the lighthouse (+ the beam brightening it), uplit landmarks
      (EMPIRE, sunburst, m-right), the waterfront row behind `&force=flood-front`
- [x] The signs: the left roof slot removed (the EMPIRE whole), the slot rule + full names (two words stacked on a roof sign, the
      long single words on the billboard), the week's rotation (every game every week), roof-sign steel lattice + catwalks, the
      blade bolder + bigger bulbs, the billboard rebuilt as a poster on its roof (lowered blocks, A-frames, catwalk, ladder) with
      four gooseneck lamps (a dim wash at night)
- [x] The glass tower: a fine outline, lit floors, its party beam; the sign's dark halo (CSS tagline + canvas logo / SPEAKEASY) +
      the moon dimmed behind the tagline; load hitches never cost a tier (8 s grace), the session's after-10 s line, the readout at
      the bottom; the panel's LIGHTS group + POWER-UP / POWER-DOWN times

### ✅ CITY 2.0 — CLEANUP C1.5 + SPEED (Oct 22, 2026) — `docs/harbor.md#cleanup-c15` (from `docs/harbor/review-2.md`; no visual change)
- [x] The O's white core: the holiday O's rules scoped to the swapped O (`[data-kind]`) with fallbacks; the flutter by a class
      (`is-flut`), never an inline style that left `style=""` behind; E2E: the flutter forced onto the O, the Halloween + St Patrick's O
- [x] The wheel's backdrop: the owner's pick d (floodlit stone, dark windows) for everyone; variants a / b / c and `&wheelbg` removed
- [x] The Safari floor: no top-level await (title.js → `harborReady`; a unit test parses every module as a script); every Harbor
      `getContext` through `canvas-safe.js#safeCtx` (a refused context draws nothing + steps the tier down; a frame that throws
      never freezes the city); the Harbor's floor iOS 16 written down
- [x] The speed gate: `title-perf.mjs --ab <before>` (A B B A in one run, the idle page hidden, settled windows, frame pacing first,
      budgets as warnings; `--vs <scene>` for a flag's cost); the E2E's PERF = frames held + no tier fell to 0 (work = warnings);
      `&debug=1` shows THE SESSION (slow frames since the city showed, the longest run, the longest frame)
- [x] The party's fill: the sky beams' sprite from a shape table (no per-pixel `Math.pow`, no readback, an LRU cache — the same
      pixels); the water's 10 Hz build never on a punch frame; the punch's second draw kept (no cheaper exact draw — Known issues)
- [x] Foundations: ONE darkness input (`core/harbor-dark.js`: `darkness()` + named ramps, today = the old thresholds exactly), THE
      SIGN-DIM HOOK (`core/harbor-signdim.js`, `harbor().dimSign`, the title's `--sd-logo` / `nd-tag-sky`) — built + tested, unused
- [x] Tidy: UFO + THE MOON CAT hidden in the panel (`ready: false`), LIGHTNING's hint, playwright reverted, dead code (STRENGTH,
      boatSpeed, LIT_GROUPS, skyPos), the searchlights' warm-up per 60 Hz frame; `tests/integration/pixdiff.mjs` (A/B pixel diff +
      bursts) — night / party / noon / golden / Halloween / St Patrick's: nothing beyond the run-to-run noise

### ✅ CITY 2.0 — THE HARBOR, THE DAY PASS (Oct 22, 2026) — `docs/harbor.md#the-day-pass`
- [x] §0 night touch-ups: behind the wheel four versions (`&wheelbg=a` more warm windows, `b` lighter + bluer, `c` a little of each —
      the default —, `d` architectural floodlighting: warm uplights washing up the stone, the windows dark); the dark corner right of
      the lighthouse lit again (a warm roofline + one ledge band, its windows; `core/harbor-neon.js#lhEdgeBlocks`, tested)
- [x] Signs by day: painted vintage faces per game (`signs.js#DAY_PAINT`: the tube letters painted thick, gold leaf / keyline, drop
      shadow, the glass a faint line on top — contrast ≥ 4.5 : 1 tested), the blade's panel, the billboard a painted poster (no tag
      line); the nightly pick from 5 am (the day shows tonight's signs) and never re-picked while a sign shows
- [x] The skyline: the sun's side continuous by day (`tones.js#sunLook` — at noon it was 0: no lit side), richer day materials, cool
      blue shade, sunlit arrises, bright ledges, cooler shadows, the bluer day haze, day windows (`blocks.js#dayPanes`), clouds in
      the glass towers; the Harbor's own day sky (`tones.js#harborSky`); the Harbor's sun (`createSun({ look: 'harbor' })`: white-hot,
      a soft bloom + a wide halo, no visible edge; City 1.0 untouched)
- [x] THE CLOUDS (the owner's add-on): `screens/harbor/clouds.js` — cumulus, stratus, cirrus, an overcast deck; the real cover + wind;
      lit for the hour (day / sunset / night / party); behind the sign, never behind the word; `KINDS` + `set({ grey, dark, base })`
      for Part 9
- [x] The water by day: a deeper blue-green, the sky in the ripples, a stronger mirror, the sun's day glitter path
- [x] The day's motion: `screens/harbor/dayfx.js` — flags in the real wind, sun glints on the towers' glass
- [x] The NEON logo: the O's permanent shade gone (its two close electrodes share one spot); the tired tube is the only imperfection
      (about every 3 h: the owner's call), checked again after mount; `&force=tired&letter=N|E|O|N2`
- [x] Tests: `harbor.test` 90 (+ the sun's side, the day sky, the Harbor's sun, the clouds' light, the painted contrast, the dark
      corner, the tired tube + its preview); e2e-harbor groups (the panel + dock need the emulators: no Java on this machine); the unit
      suite 456; the default city pixel-compared against the commit before (the same as its own run-to-run noise)
- [x] Perf (A-B-B-A, 4× CPU): day t2 5.84 → 6.11, a cloudy day 5.78 → 6.36, golden 7.83 → 7.67, night 8.24 → 8.18 ms
