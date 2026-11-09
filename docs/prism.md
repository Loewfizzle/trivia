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
  Menu music is off during the match (`MUSIC = null`); the podium plays victory. **The song file is NOT preloaded** (1.8–3.2 MB, fetched whole
  + decoded before it plays — `audio/synced-songs.js`): the match never waits for it (everything runs on the server clock), but on a slow line the
  first seconds play silent while it downloads — PD-5 (a slice-first start, `core/mp3-slice.js`, as the city's songs do).
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
  LOOK (`body[data-look]`, ☰ → Settings, read LIVE — `view.js#watchLook`): `day` = the glass look (the placeholder until PD-4), anything else = NEON
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
  preloaded — `js/games/preload-graph.js`, 29 modules / 213 KB). Far under the 1.5 MB budget; the song file is not preloaded (above).
- **THE PREVIEW (PD-1 + PD-2):** `tests/integration/prism-preview.html` mounts the REAL view (the fake database) with a scripted state — `&n=1..7`
  `&state=play|count|ko|duel|final|spec` `&rush=1` `&scheme=buttons` `&slam=left` `&world=` `&bot=1` `&under=1` `&down=1` (SLAM pressed) `&hit=1`
  `&st=47&sb=34` (the safe areas); PD-2: `&mode=survival&t=` `&solo=1` `&state=kocard|ko|spec` `&inc=1|3|6&rise=fresh|mid|hot` `&shatter=n`
  `&callout=send|blocked|twist|b2b|ko|pc` `&fresh=1&tip=1` `&after=ms`; PD-3: `&look=day|night` (default night) `&reduced=1` `&heavy=1` + from a shot's js:
  `__prism.fire('slam' | 'lock' | 'clear', { lines, combo, pc })` + `__prism.freeze(ms)` (the light layer held at that age) — the `pd3` set (35 states). `node tests/integration/prism-shots.mjs "<chrome>" ./shots-prism [cpu]`
  shoots every state at 390 / 402 / 430 with each phone's real safe areas (`SIZES=`, `ONLY=`, `SETS=look,states,worlds,pd2`; an entry may be
  `{ q, js, w }` — a line of JS fired just before the shot) + the frame timing per tier (`PERF=0` skips it; `Q=` adds to every URL).
- **Measured (PD-2, prism-shots.mjs, 390 × 844 @3, 7 opponents, a bot, 4× CPU, GPU):** 60 fps at every tier (p95 16.8 ms); 2.1 ms CPU a frame
  (PD-1: 1.7), 2.3–2.5 ms with six ghost rows on screen.
- **Controls** (`input.js#makeGesture`, pure + unit-tested with 2000 random swipes): drag = follow the finger by distance (no
  overshoot), tap = rotate by screen half, slow drag down = soft drop row by row, flick (≥ ~1.15 px/ms over 70 ms, steep, ≥ 0.9
  cell) = hard drop, swipe up = hold. Settings: GESTURES/BUTTONS, swipe sensitivity, button size, reduced effects (`audio/settings.js`
  `prismScheme/prismSens/prismBtn/prismReduced`). Keys: ← → ↓ space ↑/X Z C/shift. (PD-1: the gestures are UNCHANGED — the owner: "the controls
  are really good"; the flick slams only with SWIPE-DOWN SLAM on — `prismFlick`; by default THE SLAM BUTTON drops.)

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

