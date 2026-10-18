# SLIPSTREAM (survival ride)

Deep-dive for SLIPSTREAM: course generation, rider physics, the bot, the match, the view, the look, rides, audio, adding songs.

## SLIPSTREAM (survival ride)
Everyone rides the same seeded course at once; calm, then faster and harder; the last rider still riding wins (2–8, lives 1/2/3).
- **Course** (`course.js#createCourse(seed)`, ~200 ms): control points -> cosine-interpolated heights every 0.25 m. Each hill's crest
  curvature κ = g / vL² is tuned to a launch speed vL near the base speed for that moment, so diving down the slope before it is
  what gets you airborne. Nominal time along the course (`nominalSpeed` = 1.5 × `baseSpeed`, 12 -> 26 m/s at 6:00, faster after)
  decides difficulty and biomes. Hazards unlock in order (rings 20 s, gaps 45, low ceilings 75, laser gates 100, crumbling 130,
  gravity flips 160 then every 52–70 s) and are sized by **probe rides** (`probe()`, the same launch rule + ballistics): gap
  length from a launch at 1.02–1.12 × vL, laser openings from probe heights at 1.2–2.6 × vL (blinking low beams from 3:20),
  ceilings 4.6–5.8 m over the hills. Biomes every ~45 s: DUSK DUNES, then CRYSTAL CANYON / FLOATING CITY / LIGHTNING STORM
  shuffled twice (never the same twice in a row), OPEN SPACE from 5:15; 3 sky variants each, all from the seed.
- **Rider** (`physics.js`, pure, 1/120 s): on the ground speed follows the slope (× 2.1 when holding downhill, × 1.35 uphill); a
  release where s²κ > g·cosθ launches; in the air gravity is lighter (`AIR_FLOAT` 0.62 — floaty flights, shared with
  `probe()` so hazards are sized for it) and × 2.3 while held > 0.18 s; a tap (< 0.2 s press, counted on release)
  queues a full flip (0.48 s). Landings keep momentum: at least `LAND_KEEP` (60 %) of the flight speed even meeting an upslope at a steep angle
  (a strict projection lost ~75 % and made the ride feel slow). Landing within 40° of the slope = clean (flips -> boost 2.2 + 1.6/flip + 0.55·combo; consecutive
  flipped landings build the combo; a plain jump always lands clean thanks to the attitude assist), else a crash. Gravity-flip
  zones run the rider in a mirrored frame against a ceiling track. Crash with lives left: 0.9 s rewind, respawn a little behind
  on plain ground, 2 s invulnerable (shimmer). Out of lives = `st:'out'` with server time + distance.
- **Bot** (`bot.js`): rollouts of hold/release plans with the real physics; `tests/slip-course.test.mjs` rides whole courses on
  several seeds to sudden death and checks every hazard section from a minimum-speed respawn.
- **Match** (`director.js`): count (5.2 s, songs start under it) -> play -> out detection from rider nodes (or offline > 30 s);
  riders out within 600 ms of each other are ranked by distance; LAST RIDERS (`lastAt`) at two of ≥ 3; end at ≤ 1 alive or
  9:00 (the farthest wins) -> final with results + Call the Winner (`callBonus`, as PRISM DROP) + `meta/slip/n` advanced.
- **View** (`view.js`): the rider is simulated locally on the match clock (`serverNow() − playStartAt`), publishing ~10 Hz; ghosts
  are drawn 0.14 s behind, interpolated between samples (ground-following when both samples are on the ground). Camera: the
  rider sits 28 % from the left and the screen shows exactly `look` metres ahead — `look` = 24 + 0.62 × speed, widened to fit the
  vertical span with a fixed reference aspect — so portrait (zoomed out) and landscape see the same distance ahead.
  Refresh / rejoin / > 1.2 s in the background = back near the last position with the same lives (a respawn, no life lost).
- **Look** (`sky.js`: a WebGL1 shader per biome at 0.22–0.42 of screen pixels; `scene.js`: Canvas 2D): 3 parallax silhouette
  layers per biome, layered ground, the track as a glowing line, hazards (gap lips, laser beams, zap lines, cracks, flip arch +
  ceiling, rings), ghosts with name tags, trails, shards, flashes, speed lines, lightning, seeded events (light-birds, meteors,
  airship). Tiers 2/1/0 (DPR 2/1.5/1, glow passes, layers, particles, speed lines, sky resolution) step down at p75 > 19.5 ms.
- **Rides** (`ride.js`, `localStorage na:slipride`): HOVERBOARD or LIGHT-CYCLE × RIBBON / SPARKS / LIGHT WALL trail — drawing only,
  identical physics + hitbox. Picker: the countdown's YOUR RIDE button or ⚙ -> SLIPSTREAM.
- **Audio** (`audio.js`): songs via `synced-songs.js` through low-pass -> high-shelf -> dry/reverb/echo -> swell; `TREAT` per biome
  (blended with the biome mix); airtime swell, near-crash dip (140 ms), crash muffle (0.9 s at 520 Hz), LAST RIDERS opens it up.
  Synth SFX: wind with speed, laser hum near gates, launch, flip, a landing chime up a pentatonic scale with the combo, crash,
  rewind, respawn, ring, gate, gravity flip, countdown.
- Test hooks: `window.__slip` (rider, course, bot, crash, teleport, camera, audio, announcements, tier, fps, ghostProbe…).

**Adding SLIPSTREAM songs** (the owner drops `slip9.mp3`, `slip10.mp3`, … into ~/Downloads and asks to "add the new SLIPSTREAM songs"):
1. PULSE's Python venv (see PULSE step 1).
2. `~/.cache/neural-arcade/pyenv/Scripts/python scripts/build-slip.py` — encodes new/changed songs to `audio/music/slipN.mp3`
   (112 kbps stereo, full length), analyses BPM / beat grid / energy, rewrites `data/slip/manifest.json` (`--only 9,10`, `--force`).
3. `node --test tests/slip.test.mjs` (songs data + the no-repeat playlist), then ride once (`?emu`, two slots).
4. Commit `audio/music/slip*.mp3` + `data/slip/` and push. New songs join the room playlist automatically.

