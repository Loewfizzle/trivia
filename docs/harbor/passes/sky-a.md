# SKY-A — THE HELICOPTER, THE F-22s, THE BLACKBIRD, THE TR-3B (Oct 30 2026; plan.md "OWNER'S NOTES — OCT 30 (morning)"; behind `?city=2`)

SKY was split by the owner (Oct 30 8:40 am): **SKY-A** (this pass) = the helicopter's rework + its speed, THE F-22 MODEL, THE BLACKBIRD,
THE TR-3B at full res + the legends' craft at 3×; **SKY-B** (next) = THE MOTHMAN, THE SHADOWBOXER's room, MUSIC AS RADIO STATIONS.

### Group 0 — THE HELICOPTER, REWORKED (155c832)
- THE DANCE-BREAK FLIGHT (`air.js#breakFly / breakAt / breakDraw0`, `skyfx.js#breakBand`): a 54-pt craft (was 34) LOW over the water in
  front of the skyline, in a band under every sign above it (the SIGNAL blade, the roof signs) and clear of every sign beside / below it
  (OVERCLOCK, the WAIT / WALK lantern) — never the NEON sign or JOIN / HOST; it DRIFTS BACK AND FORTH over the crowd the whole song
  (`core/harbor-heli.js#breakDrift`, on the clock) and TURNS to face where it flies (a yaw through its narrow head-on profile); lit by the
  city at night (a mid-tone paint, the neon's cool rim on top, the crowd's warm light under it).
- THE BEAM DIFFUSED: a soft wide cone (a gaussian feather) + a soft pool, baked per palette colour BEFORE the flight; a colour cross-fade =
  two baked sprites ADDED (`beamPair`).
- THE CANVAS LEAK (the owner's 949): NIGHT-C's beam minted a new glow canvas for every in-between colour (~30 a bar, never freed). Bounded
  now: 645 → 851 canvases in one minute of the break before, ~600 steady after (10 min of a party night: 560–620).
- THE PATROL: the original route as a circuit — in low over the harbor, a look, out; round behind the city; back along the far side
  (smaller, higher); TWO LOOPS; every ~30 min dusk → 1:30 am (3–4 min), hourly by day (2–3 min). The sky lane held 3 slots.
- THE SYNCED NIGHT's OWN PLAYER: `party-music.js#partyClaims` — the synced player claims the song while it loads; this phone's own player
  starts nothing first (it still covers on a dead graph, a legendary's hold, a failed load or an 8-s stall).
- The helicopter's own draw ~0.1 ms a frame (`harbor().heli.ms`).

### Group 1 — THE F-22 MODEL, EVERYWHERE (ea3d32e)
- "F22 Raptor FREE" by NLM (CC BY 4.0) baked by `scripts/bake-model.mjs f22`: gear up, the crew ladder hidden, stencils softened, gunmetal;
  4 banks × day / golden / night → `assets/city/f22/` (54 KB), loaded lazily (`f22-model.js`), blended by the hour + the bank; every F-22
  flies it (`&f22=drawn` = the A/B). THE CHASE: a tight VIC + a small unison bank mid-screen.

### Group 2 — THE BLACKBIRD
- (in progress)
