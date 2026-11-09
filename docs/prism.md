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
  Targeting (`chooseTarget`): RANDOM (re-picks every ~8 s), ATTACKERS (who hit you in the last 15 s / targets you), DANGER
  (tallest stack). Call the Winner: 10 s after you're out (rules: 12 s); bonus = `callBonus(rem)` = 0.4 × (players left − 1).
- **Score Rush:** no attacks; the match = one song (`endAt` = the song's analysed last strong beat); levels every 10 lines; a
  top-out clears the board (score kept); the finale (chord + the board shattering) is scheduled on that beat.
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
- **Visuals:** the board is Canvas 2D with pre-rendered glass sprites (`board.js`) at the phone's **FULL pixel ratio** (PD-1: 3× on an iPhone —
  was capped at 2; the HOLD / NEXT pieces + the minis too); the world is one WebGL fragment shader per
  world at 0.33–0.6 of screen resolution (`worlds.js`; uniforms: beat, energy, bloom, hue, combo, wave, danger, duel, glitch) and
  shards are a capped canvas particle layer (`fx.js`) between them. Quality tiers 2/1/0 (world scale, fbm octaves, the BOARD's DPR full / 2 / 1.5
  — `layout.js#boardDpr` — the shards' 2/1.5/1, particle cap 200/110/50, glow) step down when the p75 frame > 19.5 ms. Measured (PD-1,
  `prism-shots.mjs` at 390 × 844 @3, 7 opponents, a bot playing, 4× CPU, GPU): **60 fps at every tier (p95 16.8 ms), 1.7 ms of CPU a frame** —
  the same 60 fps as the view before PD-1 on the same page. "Reduced effects" (settings) + prefers-reduced-motion
  turn off shards, hue drift, beat pulses and camera pulses.
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
- **THE PREVIEW (PD-1):** `tests/integration/prism-preview.html` mounts the REAL view (the fake database) with a scripted state — `&n=1..7`
  `&state=play|count|ko|duel|final|spec` `&rush=1` `&scheme=buttons` `&slam=left` `&world=` `&bot=1` `&under=1` `&down=1` (SLAM pressed) `&hit=1`
  `&st=47&sb=34` (the safe areas). `node tests/integration/prism-shots.mjs "<chrome>" ./shots-prism [cpu]` shoots every state at 390 / 402 / 430
  with each phone's real safe areas (`SIZES=`, `ONLY=`, `SETS=look,states,worlds`) + the frame timing per tier (`PERF=0` skips it).
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

