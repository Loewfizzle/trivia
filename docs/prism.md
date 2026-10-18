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
  Menu music is off during the match (`MUSIC = null`); the podium plays victory.
- **Musical SFX** (`audio.js#createSynth`): every note comes from the current song's scale (`tonic` + `mode`); line-clear phrases,
  twists, KO, level-up are quantized to the song's next 16th note (beat clock from the analysis); combos climb the scale; the
  countdown ticks are scheduled on the beats before GO. Synth: soft plucks, FM bells, a detuned pad, one convolver reverb.
  `window.__prism.synthLog()` records every note (the E2E checks key + grid).
- **Visuals:** the board is Canvas 2D with pre-rendered glass sprites (`board.js`); the world is one WebGL fragment shader per
  world at 0.33–0.6 of screen resolution (`worlds.js`; uniforms: beat, energy, bloom, hue, combo, wave, danger, duel, glitch) and
  shards are a capped canvas particle layer (`fx.js`) between them. Quality tiers 2/1/0 (world scale, fbm octaves, DPR 2/1.5/1,
  particle cap 200/110/50, glow) step down when the p75 frame > 19.5 ms. "Reduced effects" (settings) + prefers-reduced-motion
  turn off shards, hue drift, beat pulses and camera pulses.
- **Checking a real phone:** add `?pdperf` to the address (it survives joining a room): a corner readout of fps, frame
  CPU time, quality tier, world resolution, audio state/latency and the songs playing.
- **Controls** (`input.js#makeGesture`, pure + unit-tested with 2000 random swipes): drag = follow the finger by distance (no
  overshoot), tap = rotate by screen half, slow drag down = soft drop row by row, flick (≥ ~1.15 px/ms over 70 ms, steep, ≥ 0.9
  cell) = hard drop, swipe up = hold. Settings: GESTURES/BUTTONS, swipe sensitivity, button size, reduced effects (`audio/settings.js`
  `prismScheme/prismSens/prismBtn/prismReduced`). Keys: ← → ↓ space ↑/X Z C/shift.

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

