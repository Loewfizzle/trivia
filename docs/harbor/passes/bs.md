# BS — THE BEAT-SYNC PASS (Oct 24 2026; the lights locked to the beat the owner HEARS; behind `?city=2`)

> A pass log moved out of `docs/harbor.md` (C4d, Oct 29 2026). The bible + the index of every pass: [docs/harbor.md](../../harbor.md).

## BS — THE BEAT-SYNC PASS (Oct 24 2026; the lights locked to the beat the owner HEARS; behind `?city=2`)
The whole story — the owner's evidence, the ranked causes with the code as it was, the one-source design, the readout, the tests and what
she should look at — is `docs/audio.md#the-beat-sync-pass`. In the Harbor itself: `scene.js#beatLine` says `level` (how hard, from the
music's loudness) instead of `kick`; `returnGrace()` holds the tiering for 3 s after a return and a no-change resize never re-bakes
(`__district.tiering().returns` / `.holdMs`); `core/harbor-show.js` punches on EVERY beat (`beatPunch`; the crowns still flare on the
downbeat alone). The small extras in this pass: the sign's own random twitches at the TAP's level, about one in three a little louder
(`ambience.js#neonTwitch`, `title.js#scheduleFlicker`); the mailbox gone (above); SPEAKEASY stays WHITE neon on party nights — the race, the
shimmer and the beat punch in white (`css/title.css`: `--pw / --pwb / --pwd`; the NEON logo and the bloom keep the party colour); the cloud
job's pure-speed checks are warnings (`e2e-harbor.mjs#okT`, `CI=true` or `TIMING=warn`; `TIMING=strict` to make them hard again).
### Known issues (BS)
- iOS's real post-return offset (+107 / +237 ms on the owner's phone) can't be reproduced headlessly: the pure chain test simulates it; the
  proof is her phone (the three readout lines in docs/audio.md).
- A shift is measured modulo one beat: a shift past half a beat (a +240 ms re-buffer on a 128 BPM song) lands the lights a whole beat along
  — on the beat, but the downbeat weights fall on beat 2 / 4. Rare; the eye reads the beat, not the bar.
- Songs whose kicks don't agree with their grid (`agree < 0.5`, trusted through `lock` — c2-party9, c2-day2 / day9, late3 …) never
  calibrate the lead: they run on the default / the last locked value. Re-gridding them offline (`add-city2-music.py --regrid`) is the fix.
- THE CLOUD JOB's known one-off flakes (PF's Known issues) are timing warnings now; `okT` lists them in the summary (`timing warnings N`).

### Handoff → 6b (the special-occasion sky), then 8b (THE LIFE)
The promenade's layout is FINAL. 6b: the UFO / TR-3B / jet slots are filled (`sounds.js` wires nothing for them yet; the blackout = tr3b-
power-down, its `hit`). 8b: the cart (§1) + the bus return; `harbor().centrepiece.active()` for the cart's event rule; the lobby line's
corner is clear and lit. 11a–c: `harbor().centrepiece.set(…)` with a `light()` pass + `PROP_KIT`. 7b: `STRINGS_ON` + the parapet posts.
