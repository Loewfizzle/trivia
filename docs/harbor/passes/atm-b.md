# ATM-B — FOG AS DEPTH, THE STORM, FREEZING RAIN, HEAVY SNOW IN LAYERS + THE BLIZZARD (Oct 31 2026, City 2.0)

The second half of ATM (the owner split it, plan.md "OWNER'S NOTES — OCT 31 (night)"), built on ATM-A's ONE WIND STATE (`core/harbor-wind.js`
→ `scene.js#WF`): every new effect reads it, there is no second wind. Step 0 = "OWNER'S NOTES — OCT 31 (morning)" (ATM-A green on its first
cloud run; the owner reviews ATM-A + ATM-B TOGETHER → ATM-C, a cleanup pass for both, before Part 10).

## Group 0 — ATM-A's leftovers
- **THE PANEL PARTY ON race** (the music check that missed once under the full suite's three shards — `c2-evening9 → null` after 25 s, the
  beat still on the grid): not reproduced in 26 runs (CPU-throttled 8×, five browsers at once), but the code had a hole that gives exactly
  that symptom — the synced player's `handed` flag carried over a STATION CHANGE (evening → party). If the new deck's NEXT song decoded
  before its current one, a voice queued for later read as `playing()` while nothing sounded, so `partyMusicTick` kept returning "synced"
  and the 8 s stall cover (`PARTY_WAIT_MS` → this phone's own player) never ran. FIX (`audio/party-music.js`): the hand-off is reset with each
  new player, and the handed path can't hold the phone silent past `PARTY_WAIT_MS` since the last sound heard (the stall guard then decides,
  its wait counted from that last sound). Not a tolerance; the test is unchanged.
- **COATS + SCARVES STREAM** (`folk.js#setFolkWind` — `{ flap, t, at, W, down, icy }`): a long / short coat's hem swings out downwind (the
  downwind corner lifting, a quick flutter), a scarf's tail streams out from the neck as one bold rippling ribbon; each person's share follows
  the GUST WAVE at their place (`WF.at(u)`); the blizzard bows the heads (`down`). From ~7 m/s, full at ~20.
- `shots.mjs --zoom` fixed (newer puppeteer hands back a Uint8Array).

## Group 1 — FOG AS DEPTH (`screens/harbor/fogdepth.js`)
- The district's fog layer (one light tint stacked three times) is gone from the Harbor. Now three VEILS by depth, each a gradient from the
  sky to its band's foot: after the far rows (dense: 0.86–0.97 — GONE; mist 0.36–0.6), after the near skyline (dense 0.52–0.76 — ghostly;
  mist 0.15–0.34), over the harbor's pieces (dense 0.24–0.48); a light veil + a drifting BANK on the road (the crossers fade in + out) and a
  faint wash + a thin bank on the promenade (thicker at its far side) — the near stage stays clear.
- THE LIGHTS IN FOG: every lit sign + the NEON logo a soft HALO over the veils (the glow you see where the building is gone), the speakeasy's
  lit windows smeared warm, the implied lamps' light hanging in the murk over the promenade (a warm lift from the screen's foot — NO
  LAMPPOSTS). The lighthouse's broad cone + glow, the beams' softening, the beacons' breathing red halos and the foghorn were already there
  (lighthouse.js / fogbeam.js / lights.js / sounds.js) and read the same `LK.fog`.
- NIGHT FOG IS LIT: a violet-grey brighter than the dark city (lit from below — warmer low); by day a pale grey-white; a party night leans
  magenta. MIST vs DENSE: `fogLook(fog)` → `k` (shown) + `m` (0 mist … 1 dense) — the e2e measures the skyline band's contrast: clear 61 ·
  mist 42.5 · dense 35.5.
- Driven by the live visibility as before (`core/weather.js#fogOf`: dense only for a fog code under 300 m; a live "none" never beats a real
  answer). The tier table's `fogHalos` [8, 16, 24]; the promenade's bank from tier 1.

## Group 2 — THE STORM (`stormdeck.js`, `lightning.js` rewritten, `audio/city-sound.js#cityCrack`)
- THE STORM DECK: a baked tile (~1.6 screens wide, ~5 MB at dpr 2) — a LOW HEAVY BASE of dark rolls with sagging pouches along its
  underside + dark CUMULONIMBUS TOWERS rising behind the skyline into an anvil; ROLLING IN on the wind (≤ 3 pt/s), easing in over ~12 s live /
  ~3 s on a preview; LIT FROM INSIDE: each strike's patch of the deck glows through its own shapes (a small scratch canvas: the deck's shapes
  in that patch filled with the strike's light, faded to nothing at its edge). `&force=no-storm-deck` = A/B.
- THE LIGHTNING — three kinds: INTRA-CLOUD (the deck lit, no bolt), FAR (a branching bolt behind the far skyline), CLOSE (a THICK jagged
  fork — a violet glow, a blue-white body, a white-hot core, 3–5 branches with sub-branches — IN FRONT of the skyline, landing on a tower's
  crown, the harbor's water (a burst of light on the surface) or THE NEEDLE ~1 in 6 close strikes (`mmTipOf`)); 1–3 RETURN STROKES ≥ 0.13 s
  apart inside 0.62 s; THE LIGHT THROWN — the whole near scene lifted for an instant from the strike's side (brighter toward it).
- SAFETY (unit-tested): the sky's glow capped (0.42), the city's lift ≤ 0.12, never more than 3 flashes in any second, strikes ≥ 4.5 s apart;
  REDUCED MOTION = a dimmed single pulse (≤ 0.13), no bolt, capped every frame (an unset motion counts as still) — the thunder still rolls.
- THE THUNDER BY DISTANCE (`sounds.js#thunder`): a CLOSE strike CRACKS right on top (0.5–4 s after, a synthesized split — two tearing peaks
  falling into a low boom, on the city's own chain + limiter) with the recorded roll under it + a dip in the music; a far one a long low
  roll, later + softer, a smaller dip; an intra-cloud flicker a soft grumble. A roll never lands on another (a crack never waits).
- THE RAIN in the storm's gusting sheets: the forced storm's wind 9 → 12 m/s (gusts 22) so ATM-A's gust sheets read.
- THE PANEL: WEATHER FX → CLOSE STRIKE (`&force=strike`: a close one every ~10 s, the first within ~3 s); TOOLS → STORM DECK OFF.

## Group 3 — FREEZING RAIN = ICE (`icefx.js`)
- ICICLES hang from every ledge the snow already knows (snow.js#speakStep): the awning's front edge, the cornice's drip edge (9.85), the belt
  course (4.3), every window head + the shop window's; the vertical BLADE's bottom (its bulbs' warm white) + a glaze down both sides; the ROOF
  SIGNS' bottoms in their own neon colour; the RAILING (drawn after the road layer — the stage's trees + the blade stand in front of it,
  starting at the speakeasy's edge); the benches' seats. Each icicle a pale body, one bright highlight, a twinkling tip; 3–13 pt long, 1.4–2.6
  pt wide at phone size; they grow with the ice (~4 min live). A GLAZE line on every edge; an ICE SHEEN + slow glints on the promenade.
- THE RAIN finer + glinting in a colder, clearer light (a share of beads glint at the head). CAREFUL STEPS: the same ground speed (the shared
  plan) in short quick steps (`folk.js#STEP` × (1 − 0.45 icy)). Sleet ticking on the glass (Grok's sleet-glass-1) near the speakeasy's
  windows, quiet. The sign's glaze + its going dark with the power: glasswx.js as before.
- The tier table's `icicles` [50, 110, 180] (+ the railing's 40). `&force=no-ice` = A/B.

## Group 4 — HEAVY SNOW IN LAYERS + THE BLIZZARD
- THE LAYERS (`snowfx.js`): the far fine flakes drawn behind the near skyline, the mid layer over the harbor (under its veil), the big near
  flakes over everything (that call moves them all); heavy snow = more + bigger near flakes + a white veil softening the skyline (the fog
  module whitened by the snow — `fogdepth.js` `snow`).
- THE BLIZZARD (`core/harbor-weather.js#blizzardK`, unit-tested): heavy snow (k ≥ ~0.5) AND a strong wind (11 → 16 m/s, or gusts 17 → 25) OR a
  low visibility (800 → 400 m); eased in over ~1.5 min live. A WHITEOUT with depth (the far rows gone first, then the middle — the fog
  module's `whiteout`), the neon cutting through as soft glowing smears (the halos), the snow DRIVEN SIDEWAYS (the near + mid flakes short
  streaks along their flight), FEW PEOPLE OUT (it counts like a storm's rain in the crowd's size — no umbrellas), heads down, holding hats,
  coats streaming. THE SOUND: Grok's two blizzard loops alternated every ~2½ min under the snow's hush + the gale bed, the gusts on the waves.
- THE TREES SHAKE SNOW OFF in the gusts (a puff from a crown as a gust reaches it), GROUND SNOW blows in streamers along the stones +
  banks in DRIFTS against the speakeasy's foot + the benches' legs (the promenade only — never the street under the dock). The climate
  fallback never invents snow (untouched).
- `&force=heavy-snow` / `blizzard` + the panel's WEATHER → COLD rows HEAVY SNOW / BLIZZARD.

## Group 5 — the numbers
- **`title-perf.mjs --ab`** (A = 355d538, the commit before the pass, on :5174; 4× CPU, 390×844, the software-composited test browser —
  every weather scene is far over the 8 ms budget on BOTH builds here; the phone decides): a plain night **same** (t2 +4.3 ± 8.8, t1 −0.0) —
  the pass costs nothing in clear weather · DENSE FOG first **SLOWER** (+29.6 ms at t2: the halos' area — the NEON logo's uncapped halo was
  ~1100 pt — + three veils over the whole sky) → the halos' radius capped (64 pt, the logo 130) + fewer (tier table [6, 10, 14]), the middle
  + harbor veils from the crowns down, the stage wash + the lamps' glow to the dock → **same** (t2 +4.4 ± 5.3, t1 +2.7) · THE STORM with
  close strikes **same** (t2 +3.7 ± 6.0, t1 +4.7 ± 8.8) · FREEZING RAIN **same** (t2 +1.6, t1 −3.6) · a plain SNOWFALL **same** (t2 +8.6 ± 10.4;
  the snow off on both: +6.5 ± 7.5 — the run's noise) · THE BLIZZARD has no A (the old build doesn't know the flag): `--vs` a day's snowfall
  +66 ms at t2 → its work ≈ 122 ms, ≈ the old build's own storm (128) — the heaviest weather class, where heavy rain + storms already sit.
- **THE BASELINE GUARD**: a plain night 0.45×, the forced bus 0.69×, the dog walk 0.61× (≤ 2×).
- **MEMORY + CANVASES**: + the storm deck's tile (~5.2 MB at dpr 2, only during a storm, freed with the scene) + a small flash scratch
  (≤ 420×320); the fog's halo sprites (≤ 24 × 64²) + one 512×96 tile + its tinted copy; the ice draws live (no canvas). The memory guard:
  nothing stepped down (the bakes want 30.5 MB + 2.1 MB of 160); NEVER FREEZE: no canvas climb (3 → 3 on the page).
- **THE PHONE BENCH**: + `fog`, `freezing`, `blizzard` scenes; `storm` now with close strikes (a full run ~14 min — the scenes + the profile
  can run apart). WebKit (the iPhone-like 402×660 case) isn't runnable on the mini PC — the owner's bench on his iPhone is the verdict.
- **THE FULL LOCAL RUN** (the mini PC, alone): unit 935 / 935 · rules 45 / 45 · `/api` 25 / 25 · smoke `GAMES=cipher` 3 / 3 · the FULL harbor
  suite **777 / 781** → classified: ATM-A's two machine-timing checks (THE TOAST'S ARM STEP 0.26 vs 0.25; A CALM LOAD at 2× CPU — the pre-pass
  build fails both the same; warnings in the cloud); THE DOG's TURN 11.3 vs 11 u/s + SONG CLOCK 0.122 vs 0.12 beats under the three shards —
  both pass alone (9.4 u/s · 0.007 beats). A re-run then caught PANEL "clearing the mood goes back to DAY" once (not in the full run): the
  check waited for ANY change, then read once — now it waits for the DAY song itself (`music` 112 / 112 ×3).

## Decisions (Claude Code's calls — the owner may overrule)
- The storm deck's towers are plain dark masses: lit cauliflower crowns were tried twice and read as rows of balls / soap bubbles at phone
  size (the phone-first rule) — the lightning reveals their shape.
- The PANEL PARTY ON fix targets the one code path that matches the symptom (not reproduced locally); the full suite's run is the proof.
- The close thunder's crack is synthesized at runtime (no file, no credit) — a recorded close crack wasn't in Grok's folder.
- Careful steps change the stride only, not the walking speed (the speed is the shared plan: changing it would move every visit on every phone).
- The blizzard thins the crowd through the planner's storm cut (the same plan on every phone; nobody pops: the PEOPLE RULE's rejoin).
- Fog and snow share one veil module (a whiteout IS fog, white).

## Known issues
- The local run's timing checks (the toast, the calm load) + two shard-load misses (the dog's turn, the song clock) — see Group 5.
- THE BUS CRAWLING in the blizzard (+ its lamps glowing) is NOT built: the buses run on the shared timetable — slowing them is a planner
  change (every phone) → ATM-C or SCHED.
- The cart's glaze isn't drawn (it's only out in the evenings; the benches + the railing carry the glaze).
- The storm deck by day is dark masses without a sunlit side (see Decisions).
- The fog's halos on the far signs are drawn over the near rows' veil (a glow that "bleeds" through — plausible in fog, not depth-sorted).

## Handoff to ATM-C
- The owner reviews ATM-A + ATM-B together; the links are in the summary. Pending from ATM-A: the TR-3B's reflections on the water.
- The storm deck's tile + the icicles' edges are made once a layout — a new speakeasy ledge or sign gets its ice by adding an edge in
  `scene.js#iceEdgesNow`.
