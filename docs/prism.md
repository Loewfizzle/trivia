# PRISM DROP (falling-block battle)

Deep-dive for PRISM DROP: engine, battle rules, songs, musical SFX, visuals, controls, adding songs. Never use the words "Tetris", "tetromino" or "T-spin" anywhere.

## PRISM DROP (falling-block battle)
**Never use the words "Tetris", "tetromino" or "T-spin" anywhere** (UI, text, assets, code comments shown to players). Pieces are
"pieces"/"prisms", spins are "twists". Own identity: luminous glass jewels, white light with spectral edges.
- **Every phone runs its own board** (`engine.js`, pure, fixed 1/120 s steps — frame rate never changes play). Same pieces for
  everyone: `pieceAt(game.seed, n)` = 7-bags shuffled from the match seed. What leaves the phone: a ~5 Hz snapshot (`prism/…`: board
  string "0–8" per cell from the bottom row, active piece, stats, target), a full save every 3 s (`sv`: board, queue position n,
  hold, combo/b2b, pending junk, last attack key) — a refresh restores from it — and attacks (`prismq/{target}`, pushed at once
  with server time; the target's phone applies them: `receive()` with delay = 1 s, or 2.5 s when its stack is ≥ 16 rows tall,
  minus how long the attack was in flight). Junk lands on the next lock without a clear; a clear cancels pending junk first.
- **Battle:** attack table 1→0, 2→1, 3→2, 4→4; twist single/double/triple 2/4/6; mini twist (double) 1; back-to-back +1;
  combo bonus `COMBO_ATTACK`; perfect clear 10 (+b2b) + combo; × (1 + badge bonus) with the fraction carried (`frac`).
  Speed: level = 1 + minutes played (cap 12). Sudden death: after 5 min, one junk row every 10 s (gap from the seed). A top-out
  writes `st:'out'` + `by` (the sender of the last junk received = KO credit); the director orders knockouts by time, moves badges
  (`applyKo`: killer gets victim's + 1), counts KOs, sets `duelAt` when 2 of ≥ 3 remain, ends when ≤ 1. Offline > 30 s = out.
  **AUTO-TARGET (PD-2 — `logic.js#autoTarget`, no button, no setting):** your attacks go to whoever is attacking you (the most recent attacker
  still alive — `attackersOf` over every attack you received), otherwise a random living opponent, KEPT while it stays valid; re-picked when an
  attack arrives and every ~0.6 s. The old RANDOM / ATTACKERS / DANGER modes + `na:prism:target` are gone. Badges + KO bonuses work as before,
  behind the scenes (no panel). Call the Winner: 10 s after you're out (rules: 12 s); bonus = `callBonus(rem)` = 0.4 × (players left − 1).
- **Score Rush:** no attacks; the match = one song (`endAt` = the song's analysed last strong beat); levels every 10 lines; a
  top-out clears the board (score kept); the finale (chord + the board shattering) is scheduled on that beat.
- **SURVIVAL (PD-2):** no attacks (the engine runs in mode `survival`: it sends + counters nothing); junk rows rise for EVERYONE on one seeded
  schedule — `logic.js#survivalRows` / `survivalRowAt` (the k-th row's time, ms after GO: one every 10 s, a smoothstep over `SURV_RAMP_MS`
  150 s to one every 4 s), the gap = `survivalGap(seed, k)` (sudden death's rule), each phone inserting them at the server-clock moment
  (`eng.sd` counts them — saved, so a refresh keeps the count). Speed = battle's (`battleLevel`). Last one standing wins (no KO credit, no
  badges); the results' `t` = the time survived (ms); the standings' score = the seconds survived, then the lines. Calibration (bots on the real
  schedule, solo): the strongest bot ~100 s median (65–147 s), a weak one ~45 s — real players outlast the bots; typical 2–4 min.
- **SOLO (PD-2 — meta `SOLO: true`, the console's solo lane):** ONE player may start SCORE RUSH or SURVIVAL (the streak + a small capped XP, never
  a win). BATTLE needs 2: its choice carries `when: n => n >= 2` (the options sheet's per-choice filter — screens/game-options.js), and
  `cleanSettings(s, players)` deals SCORE RUSH to a room of one whatever was asked. A solo SURVIVAL plays until you top out (the KO card + the
  podium show the time: `scoreText` on the console's SOLO RUN line); a solo SCORE RUSH plays the song. Neither feeds a board (no `-solo` board
  exists for PRISM); `match-report.js#soloEmpty` decides PRISM's empty run by points / lines only (a phone on the table "survives" a while).
  THE BOARD's PRISM DROP tab: SURVIVAL wins count as PRISM DROP wins + win rate (no new board).
- **THE FACTS FOR PD-5's CARDS (the results, written by the director at the end):** `ko` (KOs), `pc` (perfect clears — the save's `st[3]`),
  `dz: 1` (BATTLE only: your stack reached the TOP 5 ROWS — the engine's `peak` ≥ `DANGER_ZONE_ROWS` 16, saved as `sv.pk`; the save is written at
  once when it first happens + at the end, so a winner's flag is never 3 s stale) — FIRST KO, PERFECT CLEAR, COMEBACK (= the winner + `dz`).
- **THE RISING GHOST ROWS (PD-2 — the red bar is gone):** the engine's pending junk drawn ON your board — `incoming.js#ghostBands` (PURE) turns
  the queue into bands from the bottom up (the newest attack at the bottom, the oldest on top — the order they will really land): a fresh attack
  shows 30 % of its rows at once and slides up from below the board's edge as its delay runs out; due = fully up + HOT (a faster shake, a brighter
  glow); it goes SOLID exactly when the engine lands it (the next lock without a clear — unchanged). Drawn by the LOOK's hook
  (`board.js#LOOKS.glass.incoming` — PD-3 / PD-4 add their own) OVER the bottom rows: an empty cell gets a hatched see-through ghost (never
  mistaken for a block), an occupied cell is only tinted (the stack stays readable), the gap stays open, a bright leading edge on top, ≤ 12 rows
  drawn. A clear that cancels them (the engine's counter, oldest first) SHATTERS the top rows on the board itself (`board.shatterGhost` —
  ~0.5 s of hatched shards + a flash). The tag `INCOMING 3 · EVE` (`incomingTag` — the biggest sender, "+1" per other) rides just above the ghost
  rows' top edge or your stack, whichever is higher (never over a block; a transform). SURVIVAL's next row (and BATTLE's sudden-death rows) rise
  the same way over their last 3 s (`sched`, no tag, can't be cancelled).
- **THE CALLOUTS (PD-2):** the kit's announcer (`createAnnouncer(…, { fit: true })` — `--len` sizes the headline to the board: never a wrap) in
  `.pd-callout`, centred over the board's upper middle (never the bottom rows / the incoming rows), ~1.1 s each: one per moment (a batch of engine
  events → `part()` → `flushCallout()`): the headline big (PERFECT CLEAR · BACK-TO-BACK · TWIST +2 · 4 LINES · COMBO ×3 · BLOCKED! · +4 → DANA)
  and the rest small under it; `KO → EVE` for the one who scored it (the others see the top line's "X KO'd Y"). BLOCKED! = the shared `--good`
  (a word too). The rail tile you hit flashes (PD-1's `rail.hit`).
- **THE TIP (PD-2):** "Clear lines to attack your friends." — the first BATTLE on this device (`na:prism:tip`; the console's one-time hint is the
  dailies'), at GO + 0.8 s, gone after ~5 s or on the first move.
- **KO → CALL THE WINNER → SPECTATE (PD-2):** the KO card on your board (KO · BY DANA / TOPPED OUT / THE JUNK GOT YOU / SIGNAL LOST · 5TH PLACE;
  solo SURVIVAL: SURVIVED 1:42) for 1.8 s (`KO_CARD_MS`), then the kit's Call the Winner (`ring: true` — 20 ticks round a circle go out one by one
  + the seconds, opacity only; big tap targets; the line under a name = their stack) with the KO card stepped back, then SPECTATE: the two
  leaders' boards BIG side by side (live; SCORE RUSH: the top two scores, else the two lowest stacks then the most KOs, kept in seat order), the
  higher one outlined red from 12 rows, `DUEL SOON` in the header when two remain, the rest of the field as one line (initial · stack · KO). A
  name opens THE PLAYER PAGE — only here, never during live play. A refresh after the KO goes straight to the call / spectating.
- **Songs:** `meta/prism` holds the room's playlist seed + position. `playlistAt(seed, k, ids)` = per-cycle seeded shuffles, a cycle
  never starts with the song the last one ended on, so nothing repeats until all have played. A match takes the next song(s)
  (battle deals 5 in a row; if it outlasts a song the next crossfades in over 4 s and the world transforms); the final step
  advances `meta/prism/n` by the songs used. Like PULSE, each song is decoded once into an AudioBuffer and scheduled on the audio clock
  (`pulse/clock.js#ctxAtServer`) — never streamed through an <audio> element and "corrected" (that version warbled and
  stuttered on phones). Only the playing song + the next (≤ 45 s before its turn) stay decoded; after a suspension the song
  is restarted once at the right spot. It plays through a low-pass (DANGER: stack ≥ 13 rows sinks it toward 600 Hz) and a lift gain (DUEL).
  Menu music is off during the match (`MUSIC = null`); the podium plays victory. **The song file is NOT preloaded** (1.8–3.2 MB) — it streams in
  at the start, QUICK-STARTED (PD-5A, below); the match never waits for it (everything runs on the server clock).
- **THE TWO SETS — THE HOST's SET (PD-5A, Nov 9 2026):** NIGHT = the original five (`prism1-5`, unchanged: no `look` in the manifest) · DAY =
  five lo-fi songs (`prismd1-5`, manifest `look: 'day'` + a HAND-SET world, never the mood picker): Roof Tops → sunset · Summer Felt Longer Then
  → city · The Last Long Day → crystal · Feeling Human Again → aurora (HoliznaCC0, CC0 — ☰ → CREDITS) · the owner's City song c2-day8 → nebula
  (encoded from his ORIGINAL `Downloads/day/day8.mp3` — the md5 the city's import recorded). At `start` the HOST's resolved look (THE GAME LOOK
  — AUTO = the host's sun: `kit/look.js#resolveLook` + `sunUpNow`) picks the room's set → `game.set`; EVERY phone plays that set's songs in
  sync whatever look it draws (the view reads `game.songs` only); a host change keeps it (the director never touches it); a refresh rejoins the
  same song at its place. Each set its own no-repeat shuffle (`logic.js#dealSongs`): NIGHT on `meta/prism/n` (the deal is byte-for-byte the
  old one — a test proves it), DAY on the seed `<roomSeed>:day` + its position in THE NIGHT's MEMORY (`meta/used/prism/dn<N>` = the day
  playlist has reached N, the highest counts — `dayPos` / `dayKey`; no rules change). A day song's CUE-IN (`cue`, s — a soft intro skipped:
  the room's schedule starts the FILE there; the file untouched) → `game.cu` (ms, only when a song has one); its slot ends at its LAST STRONG
  BEAT (`slotOf`: `sd` = lastBeat − cue + the 4 s crossfade) — BATTLE / SURVIVAL crossfade into the next day song FROM that beat (the night
  set keeps its whole-song slots). SCORE RUSH = one song, its end = `lastBeat` after the cue (`logic.js#matchTiming` — GO on a downbeat ≥ 3.2 s
  into the schedule, both on the song's own grid). The preload predicts the set from THIS phone's look (most rooms' phones share a clock).
- **QUICK START (PD-5A — `audio/synced-songs.js` `quick: true`, docs/audio.md "QUICK START"):** the song is STREAMED (one request); as its bytes
  arrive SLICES are decoded from the stream's first frame — 12 s, 30 s, 75 s, each at least where the song will be (its place now + 6 s); when
  the song is due + nothing sounds, whatever has arrived (if it covers the moment + 1 s); a slice running low (< 3 s left, in the first 45 s)
  re-cut from what has arrived (≤ 8 slices). Every slice's samples ARE the whole decode's (`core/mp3-slice.js#prefixCut` — a frame boundary;
  the E2E compares all ten files: the difference 0) → the player SWAPS slice → longer slice → whole on ONE SAMPLE (`core/sync-math.js#envelopeFrom`
  carries the gain on): no seam, no double play, no re-place. **A CUE-IN = RANGE MODE:** the stream starts at a frame ~0.5 s before the cue — ONE
  Range request, placed from the file's first audio frame's byte the build measured (`ff`, dealt in `game.ff` beside `game.cu`; without it a
  second request for the first 4 KB places it); a headerless decode lands `LAME_DELAY` 1105 samples later than the
  whole file's trimmed one — the same samples otherwise (measured: 0) — so each buffer carries its sample 0's FILE time (`bufferT0`). The intro
  is never fetched (Feeling Human Again: ~500 KB). A slice only while the rest is > 1.2 s away (good signal = one decode, as before). Slow 3G
  (50 KB/s, 2 s latency): AUDIBLE AT GO (e2e — incl. Feeling Human Again from 34.19 s, and an 8-board room sharing the line at ~17–24 KB/s).
- **THE BEAT FIX — THE HEARD BEAT (PD-5A — `sync.js` PURE + `audio.js#createHeardBeat`; tests/prism-sound.test.mjs):** before, the beat-timed
  visuals ran on the SERVER clock beside the song's AUDIO clock — an iPhone reports no output latency, and SETTINGS → SPEAKER DELAY moved the song
  earlier but not the lights → the lights ran AHEAD of what you hear. Now ONE clock, `view.js#songClock`: `pos` = the song AS HEARD = (the audio
  clock's heard time − the SOUNDING voice's origin — `synced-songs.js#voice`) − SPEAKER DELAY − what the browser can't report (an iPhone's built-
  in speaker: 20 ms, the city's figure — 0 when it reports a latency) − the measured lead; before a voice sounds, the same place from the room's
  clock (`serverSongPos` — the two agree: e2e 0–1 ms). The world's pulse (`beatPulse`), the countdown's numbers + ticks, the musical SFX (the
  next 16th: `atCtx(songT)` = the voice's origin + songT + the lead — the song's own clock, so a SPEAKER DELAY no longer puts every clear late),
  SCORE RUSH's finale — all read it. **THE MEASURED LEAD** (the city's approach — core/harbor-beat.js): a listener on PRISM's song chain (the
  city's own: a 150 Hz low-pass → a 1024 analyser's time-domain RMS, its KICK_LAG) hears the strong kicks; `leadKick` turns their distance from
  the grid into ONE number per song, slowly + bounded; a trusted grid ALWAYS punches — the kicks only trim it, and only up to `LEAD_CAP` 60 ms:
  kicks that pull it further sit OFF the beats (a syncopated groove — Summer Felt Longer Then's) → that song is the grid alone (DEAF, lead 0 — never a
  wrong shift); a lead still settling isn't applied. Measured in Chrome: c2-day8's kicks land within ±10 ms of the grid (lead −3 ms, locked); prism1
  + Summer Felt Longer Then → deaf (the grid as built). What no page can hear: a Bluetooth / TV delay iOS doesn't report → SETTINGS → SPEAKER DELAY
  (☰ → Settings, in a match too) — the song plays that much earlier AND the lights hold back the same. THE BEAT CHECK on a phone:
  `prism-preview.html?beat=1&song=<id>` (a big flash on every beat as heard + the readout: the lead, the delays, the slice).
- **Musical SFX** (`audio.js#createSynth`): every note comes from the current song's scale (`tonic` + `mode`); line-clear phrases,
  twists, KO, level-up are quantized to the song's next 16th note (beat clock from the analysis); combos climb the scale; the
  countdown ticks are scheduled on the beats before GO. Synth: soft plucks, FM bells, a detuned pad, one convolver reverb.
  `window.__prism.synthLog()` records every note (the E2E checks key + grid).
- **THE LAYOUT — THE MAX BOARD (PD-1, Nov 9 2026; the owner's plan in docs/games/plan.md "PRISM DROP — THE REWORK PLAN"):** `layout.js` (PURE —
  `tests/prism-layout.test.mjs`) sizes everything from the screen + the real safe areas (the view reads `.pd-ui`'s resolved paddings once per
  layout change, never in the frame loop): the corner row (☰ top-left · THE TOP LINE · the music top-right — the shared OC8 buttons, PRISM draws
  nothing of its own up there) = 52 pt under the safe area; under it THE FIELD, centred: `[12 pt][THE BOARD 10 × 20][8 pt][THE RAIL 34 pt][12 pt]`.
  The cell is as wide as the phone allows, checked against the height (20 rows always fit — never clipped, never scrolled), snapped to the device's
  pixels (thirds of a point on an iPhone): **32.3 pt at 390, 33.3 at 402, 36.3 at 430** (was ~25), capped at 44 (a desktop's phone column: 41.3).
  - **THE TOP LINE** (between the buttons, `var(--cb-room)` both sides, centred): `BATTLE · 5 LEFT` / `SCORE RUSH · <your score>` + the world's
    name (SCORE RUSH: the time left first); its font sized from the text's length + the room (no measuring), never wrapping; an announcement takes
    the line for a moment (`.pd-top.has-ann`).
  - **HOLD + NEXT** float INSIDE the board's top corners (HOLD 2 × 1.6 cells, NEXT 4.5 × 1.6 with THREE pieces): slim see-through glass; when the
    falling piece or the stack is under one (`layout.js#panelCells` — the cells it covers) it fades to 0.3 (`.is-under`), so the piece reads.
  - **THE SLIM RAIL** (`rail.js`): one tile per opponent (54 pt, shrinking to fit 7): their colour (a left stripe + the border), their initial,
    their stack height as a fill (a scaleY layer — `is-high` from 65 % turns its edge red), KO when out, a white outline flash when your attack
    lands on them (`rail.hit`), the current target's thin white ring, a red notch on whoever is hitting you; SCORE RUSH: score order + the rank. A
    FINAL DUEL: the one tile grows and shows their board (`drawMini`). The old side columns (badges, TARGET, the stats) + the mini-board row are
    GONE — their data stays in the game state (the podium, THE BOARD, PD-2's cards); targeting keeps its saved mode (PD-2 makes it automatic).
  - **THE SLAM BUTTON** (gestures — the default): a glossy RED PUSH BUTTON at the rail's foot (36 + 8 × button size pt — 40 by default, a 52 pt tap
    area), leaning OUT into the screen margin so it never comes within 5 pt of the board: a chrome bezel (light top → dark bottom), a red dome (bright
    top-left → deep red edge), a gloss, SLAM in white; the press sinks + darkens the dome (`.is-down` from `input.js#bindButtons`), the release
    flashes (`.is-flash`); its sound = the hard drop's. transform + opacity only. Nothing like a shell DANGER tube. The LEFT setting (Settings →
    SLAM BUTTON) mirrors the rail + SLAM to the board's left (the junk meter moves to the right edge).
  - **THE BUTTONS scheme** (Settings → CONTROLS): the board shrinks to fit the button bar under it (27.7 pt at 390); no SLAM (its own DROP); the
    rail stays on the right.
  - **The countdown** card + numbers sit over THE BOARD (the overlay padded by the rail + gap), not the screen's centre.
- **Visuals:** the board is Canvas 2D with pre-rendered sprites (`board.js` — THE LOOKS: the glass jewels by DAY, the neon tubes by NIGHT, PD-3) at the
  phone's **FULL pixel ratio** (PD-1: 3× on an iPhone — was capped at 2; the HOLD / NEXT pieces + the minis too); the world is one WebGL fragment shader
  per world at 0.24–0.45 of screen resolution (`worlds.js`; uniforms: beat, energy, bloom, hue, combo, wave, danger, duel, glitch + PD-3's calm, board)
  and shards are a capped canvas particle layer (`fx.js`) between them; PD-3's LIGHT LAYER (`light.js`) sits ABOVE the board. FOUR quality tiers (PD-3
  — `tiers.js`, below) step down when the p75 frame > 19.5 ms. Measured (PD-1,
  `prism-shots.mjs` at 390 × 844 @3, 7 opponents, a bot playing, 4× CPU, GPU): **60 fps at every tier (p95 16.8 ms), 1.7 ms of CPU a frame** —
  the same 60 fps as the view before PD-1 on the same page. "Reduced effects" (settings) + prefers-reduced-motion
  turn off shards, hue drift, beat pulses and camera pulses.
- **THE NIGHT LOOK (PD-3, Nov 9 2026 — the owner's decisions: docs/games/plan.md "PD-3"; the pass log: docs/harbor/passes/pd-3.md).** THE GAME
  LOOK (`body[data-look]`, ☰ → Settings, read LIVE — `view.js#watchLook`): `day` = THE CRAYON LOOK (PD-4 — below), anything else = NEON
  (`.pd[data-look='neon']`). A look = sprites + effects behind one interface (`board.js#LOOKS` + the draw's `look` / `pal`); the engine never changes.
  - **THE NEON TUBES** (`board.js#neonSprite`): a solid DARK core (a deep tint of the colour), a crisp HOT EDGE tube in the piece's colour with a
    near-white core line down its middle, a fine glass sheen, the tube's light baked into the core's edges; the static glow PRE-RENDERED (a soft ring
    sprite drawn 'lighter' under the stack — never a per-frame shadowBlur); THREE variants per colour (a hotter stretch of tube — real neon is never
    even; the stack picks by place, the falling piece by cell). The landing ghost = an UNLIT tube (a thin pale line); junk = a cool grey tube; the
    danger drain the same grey sprite as before. HOLD / NEXT, the rail's duel mini, spectating's boards + the podium's winning board draw the same tubes
    (`drawPiece` / `drawMini` take `look` + `pal`; a mini under 18 device px a cell = a lit edge + a dark core).
  - **THE PALETTES** (`neon.js` — PURE): each piece keeps its COLOUR FAMILY in every world (JEWEL's hues: the long piece cyan, the square yellow…); a
    world (`WORLD_SHIFT`) pulls every hue toward its own by a capped share (`PIECE_PULL`: yellow + orange barely move — 15° apart), shades the
    saturation + lightness, leans the glow toward its colour, and brings its frame tube (`edge`), the frame's light (`frame`), the walls' line (`well`)
    + two spark colours. AURORA → teal · NEON CITY → magenta · DEEP NEBULA → violet · CRYSTAL CAVE → icier + lighter · SYNTH SUNSET → warmer. Never a
    swap. `tests/prism-neon.test.mjs`: every world keeps each hue within ±15° of its JEWEL hue, every pair of pieces ≥ ΔE 18 (CIE76), junk ≥ 25
    from every piece, sunset warms + crystal cools ≥ 5 of 7. The view sets `--pd-edge` / `--pd-frame` / `--pd-well` on a world change (the CSS: the
    board's frame = a neon tube with a white-hot core, HOLD / NEXT, the rail tiles, the top line, the callouts, the incoming tag, the cards).
  - **THE CALMER WORLD** (`worlds.js` — uCalm + uBoard): behind the BOARD only the world is dimmed to ~50 % under a soft dark glass (its HUE kept, the
    brights compressed, a little less colour — a grey wash turned a bright sky into a flat brown panel, round 1), feathered ~2 cells; a lighter
    vignette keeps the top + the edges round the board vivid. The board's own glass is thinner in the neon look (0.3).
  - **THE LIGHT ENGINE** (`light.js` + `neonfx.js`): ONE low-res WebGL canvas ABOVE the board (`.pd-light`, z 3 — the overlays at 4), pure ADDED light:
    it writes premultiplied (rgb, a = max(rgb)), so the page composites `light + below × (1 − a)` (no CSS blend mode). Soft light quads (a blob, a
    streak with a tapering tail, a soft rect, a frame ring) in ONE vertex batch, then THE BLOOM on the GPU: a bright-pass (only light above 0.42
    blooms — a wide wash would lift the board's blacks: round 2) + a dual-filter chain at ½ → ¼ → ⅛ and back up. The canvas hides itself when nothing
    is lit. **Why not bloom the whole board:** copying the 3× board canvas (970 × 1940, 7.5 MB) into a texture every frame MEASURED 0.7 ms to issue and
    2.4–4 ms to finish on the mini PC's Chrome at 4× CPU (`tests/integration/prism-upload-cost.mjs`) — and on an iPhone that 2D canvas is rasterised on
    the CPU; the light layer's whole cost is ~0.5 ms a frame (the A/B below). The effects (each big but SHORT, never covering the stack or the incoming rows):
    - THE SPILL — the falling piece's coloured light on the empty well + the blocks near it, the nearer WALL catching more at its height, a faint pool
      on the floor when it's near the bottom (top two tiers only).
    - THE LANDING PULSE — the cells that lock surge (their tubes ring with light + a soft fill), ~0.26 s; stronger after a SLAM.
    - SLAM — a light trail per column from where the piece was to where it landed (the tail catches up), then an impact flash along its foot + sparks.
    - LINE CLEARS — light RACES along each clearing row's tubes (rows alternate direction; each cell's tube surges as the head passes, 150 + 20 × lines
      ms), then the rows BURST: a white-hot flash, sparks with glowing trails (more per line + per combo step) and the shards (`fx.js`, behind the
      board, flying out into the world — every clear now, fewer for one line). 4 LINES / a perfect clear: a breath of light over the board + the frame
      flares; a combo lifts the frame's light (0.2 + 0.16 × combo), settling over ~1 s. A cancel (BLOCKED!) adds a faint red flash.
    - "Reduced effects" + prefers-reduced-motion: no motion (the race is instant, no trail, no sparks, no shards), every light × 0.35, the flash × 0.3.
    - Sounds: PRISM's own synth SFX as before (in the song's key, on its beat) — no new files.
- **THE CRAYON LOOK (PD-4, Nov 9 2026 — the owner's decisions: docs/games/plan.md "PD-4"; the pass log: docs/harbor/passes/pd-4.md).** THE GAME LOOK's
  DAY = a COLORING BOOK (`.pd[data-look='crayon']`; night = NEON; the glass look is RETIRED as the day look — kept in board.js as a look of its own, nothing
  picks it). The engine never changes; a look = sprites + moments + the page behind one interface.
  - **THE CRAYONS** (`crayon.js` — PURE): the SAME colour families as the night (JEWEL's hues — the long piece turquoise, the square yellow…) in crayon
    shades (`CRAYON`) + each one's outline = the same crayon pressed harder (`CRAYON_LINE`); junk = a graphite crayon. `tests/prism-crayon.test.mjs`: every
    crayon ±15° of its JEWEL hue (PD-3's family test), every pair ≥ ΔE 18, junk ≥ 25 from every piece, and on EVERY paper every fill ≥ ΔE 25 off it +
    every outline ≥ 3:1, the page's ink ≥ 4.5:1, the pencil ≥ 3:1.
  - **THE BLOCKS** (`crayon-art.js` — all PRE-DRAWN ONCE into cached sprites at the board's full ratio; the frame loop only blits): a waxy FILL (diagonal
    strokes pressed unevenly, the wax building up at the edges, the paper's TOOTH punched through — two octaves of value noise, thresholded), a bold
    slightly WOBBLY outline in the darker shade drawn TWICE (the second pass a little off), a few broken light strokes for the wax's sheen. SIX variants
    a colour — the stack picks one by place, the falling piece by its own cell (it keeps its drawing while it falls). The landing ghost = a light pencil
    outline; the danger drain = the same block in grey; HOLD / NEXT, the rail's duel tile, spectating's boards + the podium's winning board draw the same
    (`drawPiece` / `drawMini` take `look: 'crayon'`; a mini under 18 device px = a crayon fill + its outline). The view warms every block for the board's
    size + HOLD / NEXT's in ≤ 4 ms slices between frames (`warmCrayon`), so a live switch never draws one mid-frame.
  - **THE PAPERS** (`crayon.js#PAPERS`, `assets/prism/paper/*.webp` — CC0, the grain only, ~81 KB in all, built by `scripts/build-prism-paper.py`):
    NOTEPAD (ruled blue lines + a doubled red margin) · GRAPH PAPER (a 13 px grid, every 5th darker) · CONSTRUCTION PAPER (a fibrous slate-blue sheet) ·
    a COLORING PAGE (a thick hand-drawn frame; the doodle in black outlines like a coloring book). THE HOST DEALS ONE PER MATCH (`index.js#start` →
    `game.pp` = `crayon.js#pickPaper(seed, used)`): the SAME page on every phone, a rotation through all four, never the same twice in a row — remembered
    in THE NIGHT'S MEMORY (`meta/used/prism/pp<k>-<i>` — kit/night.js; no rules change). A game from before PD-4 takes its seed's (`paperOf`).
  - **THE PAGE** (`page.js` — ONE canvas, `.pd-page`, under everything; redrawn only when the paper / the song's world / the screen / the board's place
    changes — never in the frame loop): the grain tiled, the rulings DRAWN IN CODE, THE WORLD DOODLE (each song's world as a faint crayon line drawing —
    SYNTH SUNSET a striped half sun over a road + mountains, NEON CITY a skyline in the rain, CRYSTAL CAVE crystal clusters + stalactites, DEEP NEBULA a
    swirl of stars + a ringed planet, AURORA OCEAN wavy ribbons over waves; drawn once per song into its own canvas, the tooth punched through, at 0.24),
    then the board: its well washed with the paper (the doodle only faintly through it) + a hand-drawn PENCIL frame (two passes, the corners
    overshooting); the board's own canvas adds a faint PENCIL grid. Spectating + the podium: no board on the page. The WebGL world is NOT drawn by day
    (its work skipped) and the light layer stays off.
  - **THE PANELS GO PAPER** (css/prism.css "PD-4"): the paper's colour, ink + grain arrive as `--pd-paper` / `--pd-ink` / `--pd-grain`; HOLD / NEXT =
    slim paper cards a touch askew with a pencil border (still fading when a piece passes under), the rail = paper tiles with a hatched crayon fill for
    the stack, a red X scribble for a KO, a crayon circle for the hit flash, a pencil ring for the target; the top line in dark pencil-grey marker; the
    KO card, the count, the tip, Call the Winner, spectating, the podium's body (+ the console frame's kicker + winner line + the results rows' text),
    the BUTTONS scheme = paper. SLAM stays the glossy red push button (a paper shadow); the ☰ / music buttons stay the console's.
  - **THE MOMENTS** (`crayonfx.js`, on the board's own canvas — all short, from pre-drawn sprites): LANDING = the boing (the piece's crayon outline
    squashes + springs back, bounce marks at its foot, 0.26 s) · CLEARS = the rows SCRIBBLED OUT (a zig-zag crayon stroke races across each, rows
    alternating — the rows held on the page for the race, 120 + 20 × lines ms) then they crumble into crayon CRUMBS that pop up, fall + fade; bigger
    clears = thicker scribbles + more crumbs; a combo's scribbles in more colours; 4 LINES / a perfect clear = a big crayon STAR BURST (drawn BEHIND the
    stack — it never covers a block) · SLAM = crayon speed lines down to the landing + impact ticks · INCOMING (`LOOKS.crayon.incoming`) = grey PENCIL
    SKETCH rows (hatched both ways, never a crayon block; an occupied cell only tinted; shaking pencil marks at both sides; a pressed pencil leading edge)
    + a paper tag `INCOMING 3 · EVE`; a cancel = the pencil rows crumble into pink ERASER crumbs · the finale / a victory's board breaks into crayon
    crumbs (`fx.js` `crayon: true` — paint on paper, not light). Reduced effects / reduced motion: nothing moves (no race, no crumbs, no squash, no
    streaks) — the scribble + the star just show + fade. The crumbs' cap = the tier's sparks.
  - **THE LETTERING** = Permanent Marker (Font Diner — **Apache License 2.0**, not OFL: Google Fonts lists it under apache/; self-hosted latin woff2,
    30 KB, `assets/fonts/prism/` + `LICENSE-PermanentMarker.txt` + a CREDITS line) as `'PD Marker'`, loaded by `page.js#warmDay` through the FontFace API
    ONLY when the day look shows (never in the boot graph, never by night); the UI font until it's in. It has no `→` (the callouts' arrow falls back to
    the UI font). THE CALLOUTS: the marker with the crayon's tooth as a CSS mask (`--pd-tooth` — `crayon-art.js#toothMaskURL`) + a paper-coloured edge
    (8 offsets of `--pd-paper`) so they read over any block; BLOCKED! = the shared `--good` darkened by `color-mix` (colour-blind mode follows) + the word.
  - **Measured (PD-4 — `prism-shots.mjs` PERF with `PERF_LOOK=day`, 390 × 844 @3, 7 opponents, a bot, 4× CPU, GPU; each tier locked, ~300 frames):**
    REST — 60 fps at every tier (p95 16.8 ms), CPU a frame (p75 / p95) 2.0 / 2.8 ms (tier 3), 2.0 / 2.8 (2), 2.1 / 2.8 (1), 2.0 / 2.7 (0). HEAVY (a
    4-line clear every 650 ms with the combo climbing + six incoming rows + 7 rail tiles) — 60 fps at every tier, CPU 4.8 / 6.0 (3), 4.3 / 5.4 (2),
    3.7 / 4.9 (1), 3.0 / 3.8 (0). (The night: 3.5 / 5.7 at the top tier — the day skips the WebGL world.) A LIVE SWITCH night ↔ day mid-match: the
    longest frame 17 ms both ways (e2e-prism).
- **THE TIERS (PD-3 — `tiers.js`, `tests/prism-layout.test.mjs`):** the view starts at the TOP tier (3) and steps down while the p75 frame > 19.5 ms.
  The light goes FIRST, the board's full 3× LAST:
  | tier | board | world | light layer | bloom | spill | sparks | shards | glow |
  |---|---|---|---|---|---|---|---|---|
  | 3 | 3× | 0.45, 4 oct | 1× CSS | 3 levels | on | 260 | 200 | on |
  | 2 | 3× | 0.34, 3 oct | 0.75× | 2 levels | on | 160 | 130 | on |
  | 1 | 3× | 0.28, 2 oct | 0.5× | off | off | 90 | 80 | on |
  | 0 | **2×** | 0.24, 1 oct | 0.5× | off | off | 40 | 40 | off |
- **Measured (PD-3, `prism-shots.mjs` PERF — 390 × 844 @3, 7 opponents, a bot playing, 4× CPU, GPU on; each tier LOCKED, ~300 frames recorded):**
  REST (the bot) — 60 fps at every tier, p95 16.8 ms; CPU a frame (p75 / p95) 3.5 / 4.2 ms (tier 3), 3.5 / 4.0 (2), 2.6 / 3.6 (1), 2.7 / 4.0 (0).
  HEAVY (`&heavy=1`: a 4-line clear every 650 ms with the combo climbing + six ghost rows + the bot + 7 rail tiles) — 60 fps at every tier, p95 16.8
  ms; CPU 5.7 / 6.6 ms (3), 5.3 / 6.2 (2), 4.8 / 5.7 (1), 4.0 / 4.7 (0). A/B against PD-2 on the same page (:5174): rest 2.7 vs 2.2 ms, with six ghost
  rows 3.8 vs 3.0 ms — both 60 fps.
- **Checking a real phone:** add `?pdperf` to the address (it survives joining a room): a corner readout of fps, frame
  CPU time, quality tier, world resolution, audio state/latency and the songs playing.
- **THE PODIUM (PD-1 — the console's, docs/cartridge.md D8):** `index.js` exports `finalScene` (`victory.js`) — PRISM draws ONLY the BODY inside the
  console's frame (`ui/final.js#createFinal`: the WINNER line, BACK TO THE ROOM, the XP box, the card reveal, the results list from 4th, the
  console's winner sting — no `OWN_VICTORY_SOUND`): THE WINNING BOARD (the winner's last published board, frozen — `drawMini`) + one line
  (BATTLE: "3 KNOCKOUTS · 31 LINES SENT"; SCORE RUSH: points · lines · the best combo), then the TOP 3 as the console's slim cards (`leaderboard()`);
  a name with a profile opens THE PLAYER PAGE (`profile/player-page.js#openPlayer` — the podium only, never during live play). The old BATTLE REPORT
  table is gone. `ACCENT = '#8fd8ff'` (meta.js — the theme's spectral cyan) lights the frame's main tube. THE BOARD's PRISM DROP tab is fed as
  before (`core/match-report.js` / `core/boards.js` unchanged).
- **THE PRELOAD (PD-1):** `preload()` (every phone, the walk inside): the manifest + the FIRST song's analysis (~5 KB, predicted from the room's
  `meta/prism` playlist; a room's first match — no playlist yet — all five, ~25 KB). The worlds are shaders in code (in the view's module graph, already
  preloaded — `js/games/preload-graph.js`, 29 modules / 213 KB; PD-4: 40 modules / 370 KB). Far under the 1.5 MB budget (the day's papers + font load
  only when the day look shows — `page.js#warmDay`, ~110 KB); the song file is not preloaded (above).
- **THE PREVIEW (PD-1 + PD-2):** `tests/integration/prism-preview.html` mounts the REAL view (the fake database) with a scripted state — `&n=1..7`
  `&state=play|count|ko|duel|final|spec` `&rush=1` `&scheme=buttons` `&slam=left` `&world=` `&bot=1` `&under=1` `&down=1` (SLAM pressed) `&hit=1`
  `&st=47&sb=34` (the safe areas); PD-2: `&mode=survival&t=` `&solo=1` `&state=kocard|ko|spec` `&inc=1|3|6&rise=fresh|mid|hot` `&shatter=n`
  `&callout=send|blocked|twist|b2b|ko|pc` `&fresh=1&tip=1` `&after=ms`; PD-3: `&look=day|night` (default night) `&reduced=1` `&heavy=1`; PD-4: `&paper=notepad|graph|construction|coloring` (by day) + from a shot's js:
  `__prism.fire('slam' | 'lock' | 'clear', { lines, combo, pc })` + `__prism.freeze(ms)` (the light layer held at that age) — the `pd3` set (35 states); PD-4's `pd4` set (the day — 43 states) + `sheet` (`prism-crayon-sheet.html`: every crayon drawing on each paper; an entry may name its own `page`). `node tests/integration/prism-shots.mjs "<chrome>" ./shots-prism [cpu]`
  shoots every state at 390 / 402 / 430 with each phone's real safe areas (`SIZES=`, `ONLY=`, `SETS=look,states,worlds,pd2`; an entry may be
  `{ q, js, w }` — a line of JS fired just before the shot) + the frame timing per tier (`PERF=0` skips it; `Q=` adds to every URL).
- **Measured (PD-2, prism-shots.mjs, 390 × 844 @3, 7 opponents, a bot, 4× CPU, GPU):** 60 fps at every tier (p95 16.8 ms); 2.1 ms CPU a frame
  (PD-1: 1.7), 2.3–2.5 ms with six ghost rows on screen.
- **Controls** (`input.js#makeGesture`, pure + unit-tested with 2000 random swipes): drag = follow the finger by distance (no
  overshoot), tap = rotate by screen half, slow drag down = soft drop row by row, flick (≥ ~1.15 px/ms over 70 ms, steep, ≥ 0.9
  cell) = hard drop, swipe up = hold. Settings: GESTURES/BUTTONS, swipe sensitivity, button size, reduced effects (`audio/settings.js`
  `prismScheme/prismSens/prismBtn/prismReduced`). Keys: ← → ↓ space ↑/X Z C/shift. (PD-1: the gestures are UNCHANGED — the owner: "the controls
  are really good"; the flick slams only with SWIPE-DOWN SLAM on — `prismFlick`; by default THE SLAM BUTTON drops.)

**THE DAY SET** (PD-5A — `python scripts/build-prism.py --day [--only prismd2]`): the five sources are fixed in `build-prism.py#DAY` (id, source,
world, title, artist, Claude (chat)'s measured BPM); the originals are only read. Each: a two-pass `loudnorm` (−14 LUFS integrated, −1 dBTP — the
target pulled down until the ENCODE holds −1 dBTP) → 112 kbps stereo 44.1 kHz; then the analysis of the encode decoded back: THE DAY SEARCH
(`beat_grid_near` — the night search folds into 90–180 BPM: an 80 BPM song came out at 160) + the checks — the BPM within 0.1 of the measured one,
NO DRIFT (the four quarters' best phase: trend ≤ 25 ms, scatter ≤ 45 ms — a groove may swing, a tempo error grows), NOT ON THE HALF-BEATS (the
grid's onsets ≥ 1.15 × the half-beat grid's). A song that fails STOPS (nothing written) and prints its numbers — never a guess. Then the cue-in
(`cue_in`: the first downbeat where the song's energy has arrived and stays — 30 ms before it; 0 when it's strong from the top or under 2 s in),
the last strong beat, the key, `lufs` / `tp` / `check` in the song's JSON; `write_manifest` (night rows untouched, then the day rows with
`look` + `cue`). The numbers: docs/harbor/passes/pd-5a.md.

**Adding PRISM DROP songs** (the owner drops `prism6.mp3`, `prism7.mp3`, … into ~/Downloads and asks to "add the new PRISM DROP songs"):
1. PULSE's Python venv (see PULSE step 1).
2. `~/.cache/neural-arcade/pyenv/Scripts/python scripts/build-prism.py` — encodes new/changed songs to `audio/music/prismN.mp3`
   (112 kbps stereo, full length), analyses beat grid / key / energy / last beat, picks a world from the song's mood (tempo,
   energy, brightness, major/minor; unused worlds first) and rewrites `data/prism/manifest.json`. A file named just `prism.mp3`
   gets the lowest free number. `--only 6,7`, `--force`, `--reworld` (re-pick all worlds).
3. Worlds: five exist (aurora, city, nebula, crystal, sunset) × 3 variants. Once every world is taken, a new song reuses the
   best-fitting one. For a song that deserves its own world, add a shader body to `worlds.js#BODY` + an entry with 3 variants
   in `WORLDS` + its mood target in `build-prism.py#WORLDS`, then `--reworld`. Override by editing `"world"` in the song's JSON (kept on rebuilds).
4. `node --test tests/prism.test.mjs`; look at it in `prism-preview.html?world=…`; play a Score Rush (`?emu`, two slots).
5. Commit `audio/music/prism*.mp3` + `data/prism/` and push.

