# JAYWALK J2 — EVEN STARTS · THE BLACKBIRD BECOMES A REAL THREAT · COURSE RULES v2 — Nov 21, 2026

**RE-PUBLISH: YES — `database.rules.json` (saved as `Downloads\NEON\database.rules.nov21-j2.json`)**, any time AFTER the deploy is live and
**BEFORE 2026-11-27 4 am Eastern**. ONE new leaf: `rooms/{CODE}/jw/{match}/{uid}/cv` (the player's own, once, 1 or 2, within 3 h of its GO).
Until it is published the new code works on the old rules (the cv write refused → the run plays + counts as v1 — tested on the emulator);
after Nov 27 a run with no cv is refused, so an unpublished rule would stop JAYWALK counting (the fresh-eyes review's H1 — see OPEN FOR BEN).
Built on THE PROOF WRITER, THE CONSOLE FIX and J1 — none of them changed. The detail: `docs/jaywalk.md` "J2"; the owner's decisions:
`docs/games/plan.md` "JAYWALK J2".

## STEP 0
`docs/games/plan.md` "JAYWALK J2" (7fabf4f7). The lab export at the start: 224 marks, no open FIX. The inbox: nothing open for this pass
(the Nov 19 flyers.js gates were closed by CITY PART 1; the lab's "zero server calls" line — the owner's call — corrected here).

## GROUP 1 — COURSE RULES v2, THE PLUMBING (b305054a)
- `js/games/jaywalk/versions.js` — ONE source: `CV_SWITCH_MS` = **2026-11-22 09:00 UTC** (the 4 am Eastern turn — the streak day
  `d20261122`), `CV_GRACE_END_MS` = 2026-11-27 09:00 UTC, `versionAt` (a run's GO) · `versionOfDay` (the daily) · `runVersion` (THE CHECK:
  the proof's cv must be the version in force at the GO; none = v1 only in THE GRACE) · `tryVersion` (the daily's START).
- `course.js` / `replay.js` / `logic.js` / `api/_lib/jaywalk.js` / `jaywalk-tries.js` / `jaywalk-daily.js` / `api/daily.js` take the
  version (default 1 everywhere). The phone: solo writes cv after its GO's read-back, a match once THE FIRST GO is known, the daily plays
  what START answers (`cvs` = the newest it knows). The lab: `?cv=2` / `?cv=1`. The end line's course: the row's cv.
- **v1 FROZEN:** `tests/fixtures/jaywalk-v1/` (course + tuning + engine + replay at 28972e7b, never edited) — `tests/jaywalk-v1-frozen.test.mjs`:
  900,000+ lanes byte for byte, the hazards in time, 210 whole bot runs (solo / match / daily) = the frozen replay.
- **The rules change** — one leaf (`cv`), the ack in `tests/fixtures/rules-live.ack.json`, a rules test (`rules.test.mjs` "JAYWALK J2").

## GROUP 2 — EVEN STARTS (59545a1e)
`tuning.js#EVEN` + `course.js#openingKinds` (v2 only): ≤ 2 ground lanes in a row, ≤ 5 in any 10, ≤ 3 hazards in a row — the heat's own mix,
the calm lanes 0–3 kept. Tried five settings (the measure: `scratchpad even.mjs`, 800 seeds each); the one picked keeps the curve:

| 5,000 seeds, the steady (greedy) bot | v1 | v2 |
| --- | --- | --- |
| time to lane 50 — median | 13.9 s | 14.6 s |
| … the fastest 5 % | 9.6 s | 10.1 s |
| … the fastest 1 % | 8.3 s | 8.9 s |
| reaches lane 50 | 89.7 % | 90.9 % |
| "open" lanes 4–49 (blocked < 15 % of a hop's moments) — mean · max | 46.5 % · 73.9 % | 42.6 % · 54.3 % |
| the longest open run — median · p95 · max | 4 · 7 · 14 | 2 · 3 · 5 |
| the fewest hazard lanes in any 10 — median · worst | 3 · 0 | 5 · 2 |

## GROUP 3 — THE BLACKBIRD v2 (59545a1e, the look's refines in 5b644a40)
- RUNWAYS of 3–4 lanes, a jet a lane on one lap (staggered by the seed), the lap 4–6 s → 3–4.5 s by heat, every tell 1.6 s, THE AFTERBURNER
  TRAIL (behind the jet through its pass, then the whole lane 42 ticks — cause 'blackbird'), from lane 120, more from 250, THE AIRFIELD four,
  a SAFE ground lane before + after each. FAIR BY CONSTRUCTION: `course.js#runwaySlack` checks every layout as it is made.
- First try: an evenly spread stagger could line the jets up as a wave against the kid — razor-thin crossings (the search found start ticks
  with no way across) and a blind cross hit 87 %. Now the spacing runs from a tight cluster to the even spread, and a layout that leaves a
  careful kid < 24 start ticks a lap falls back to the cluster.

| 600 seeds | v1 | v2 |
| --- | --- | --- |
| a BLIND cross hit (straight up, hop after hop, a random tick) | 6.5 % | 72.3 % |
| … lanes 120–249 · 250–449 · the loop | 4.9 · 5.7 · 7.3 % | 58.8 · 68.6 · 76.9 % |
| a careful kid TRAPPED (no way across from a start tick, 600-tick horizon) | — | never (0 of every start tick) |
| the careful kid's worst wait — median · p95 · max | — | 1.8 · 2.9 · 3.6 s |
| the greedy bot killed by the Blackbird, per runway met | 0 / 357 | 10 / 654 (1.5 %) |
| runways (bands) to lane 450 per course | 3.9 | 7.6 |

- THE LOOK (refines): 1 — the jet (sized for v1's two-lane band) flew over the next lane → × 0.7 on a runway lane; the trail's glow spilled
  onto the neighbouring lanes + its flames read as spikes → its glow inside its lane, wider tongues. 2 — by day the trail was faint between
  two telling lanes → a dark scorched band under solid orange paint, bigger opaque flames. 3 (the review's L2) — the tongues leaned into the
  next lane → kept inside. Shots: `Downloads\NEON\jaywalk-j2\runways-sheet-390.png` (a runway by night + its trail, by day + its trail, THE
  AIRFIELD by night + day) and `Downloads\NEON\jaywalk-j2\j2\` (390 + 430, every scene: `jaywalk-lab.mjs --j2=all`).

## GROUP 4 — THE SOUNDS (59545a1e)
`runway-sound.js` (PURE) + `flyers.js`: the crackle within 3 lanes, once a visit, 8 s apart, three takes in turn; later tells a soft tick;
every scream / boom / the trail's flicker × its distance (0.75 a lane, silent from 8, silent behind off-screen). New files
(`scripts/build-jaywalk-sounds.mjs --j2`, mono MP3; credited in `audio/jaywalk/CREDITS.md` + the Credits sheet):

| file | from | MP3 | gain | into the SFX bus (LUFS · loudest 0.4 s · peak dBFS) |
| --- | --- | --- | --- | --- |
| radio-static_1 (city, as before) | — | — | 0.34 | −26.7 · −22.3 · −11.3 |
| radio-static-2 | sfx9/radio-static_2.wav | 7.3 KB | 0.5 | −26.3 · −24.0 · −12.9 |
| radio-static-3 | sfx9/radio-static_3.wav | 10.1 KB | 0.56 | −25.5 · −25.3 · −12.1 |
| runway-tick | sfx9/runway-tick.wav | 2.1 KB | 0.12 | −35.5 · −35.5 · −25.2 |
| afterburner-flicker | sfx10/afterburner-flicker.wav ("Big Branching Fire #1", Joseph SARDIN, CC0 1.0) | 12.6 KB | 0.4 | ≈ −28.5 (under the boom's −21.1 · −14.6) |

`jaywalk-mix.mjs`'s new guards: the three takes within 2 LU (3.5 at their loudest), the tick under every crackle, the flicker under the boom
(+ J1's siren / out guards).

## GROUP 5 — THE HARD LIMITS (5b644a40)
- **DRAW CALLS** (`jaywalk-lab.mjs --j2perf`: 8 kids, NIGHT, tier 2, the worst frame over a whole lap, every 4th tick frozen): a DOWNTOWN
  runway **61** (its v1 band on the same code 56; J1's DOWNTOWN with no jet 63) · THE AIRFIELD **48** (v1 47) — all ≤ 64. Why it fits: the
  jets went from a mesh each (a jet + two flames + the flames' bloom = 5 calls) to ONE instanced mesh + ONE for the flames (3 calls however
  many fly); the trail + the runway lights ride the existing instanced kinds (no call of their own).
- **FRAME RATE** (4× CPU, the world running on the runway): 60 fps at 390 + 430 (p95 16.8 ms) — one run saw a single 250 ms frame at the
  airfield at 390 (see THE FINAL RUN).
- **SIZE**: JAYWALK's line **2,544 KB / 164 modules** of 2,600 / 165 (J1: 2,520 / 163) — never raised. (+1 module: versions.js; the sound
  rule rides the lazy flyers' chunk.)

## GROUP 6 — TESTS
Unit: `jaywalk-v1-frozen` (5) · `jaywalk-versions` (6) · `jaywalk-j2-sim` (7: even starts, the runways' shape, never trapped — its own
search through the real hit test at three columns, the blind-cross threat, the trail in the engine + the boom, purity) · `jaywalk-v2-agree`
(5: phone = host = server on v2 — solo, match, daily; the old phone; the picked version refused) · `jaywalk-runway-sound` (5). The older
suites' match / solo logic pinned to v1 at their fixed 2027 test clock (`setCvSwitch(Infinity)`). E2E: `JW_CV=0` (+ serve.mjs
`JW_CV_SWITCH_MS=0`) plays v2 on the emulator — e2e-jaywalk 102 / 102 (cv 2 written once = the course played; the server counted both
runs), e2e-jaywalk-match 103 / 103, the same on the PRE-J2 rules 101 / 101 (every cv write refused → v1, counted, each phone took its
course once). The daily-run checks the try's version.

## THE FRESH-EYES REVIEW (a separate agent that wrote none of it) → fixed (5b644a40)
- **H1** — after 2026-11-27 an unpublished cv rule refuses every run (no cv past THE GRACE): the owner's date kept; it leads this log +
  OPEN FOR BEN.
- **M2** — the cv window was 20 s (a dropped signal lost it; it added no security — the server checks cv = E) → 3 h, the chunks' own; a
  solo refresh between GO and cv writes it on the rejoin (only while no hop is logged — hops are never moved under).
- **M3** — the solo GO timer kept running through the cv round trip → stopped once the GO is read back.
- **M4** — the grace let anyone pick v1, the daily included → ONE COURSE A DAY: the daily has no grace (an old phone on a v2 day is told
  to refresh). Solo + match keep the owner's grace (named below).
- **M5** — deploy timing: pushed well before the switch (see THE FINAL RUN's clock).
- **L1** — a match phone adopted v2, then flipped to v1 when its write was refused → a phone takes the course ONCE its version is settled
  (its own write's answer, never the mirror's local copy — the second-run find: the SDK shows a write locally before the server refuses it).
- **L2 · L3 · L4 · L5** — the tongues inside their lane · a jet behind off-screen silent · nothing made a frame (the jets' end, the ears) ·
  the jets' warm instance under the ground (the mesh itself never moved).
- **M1 — named, not built:** a phone still on the PRE-DEPLOY build that HOSTS a match after 4 am scores everyone on v1 (its podium /
  night record); the server's count is right (it reads each node's cv). It needs a page opened before tonight's deploy and kept alive.

## OPEN FOR BEN
1. **RE-PUBLISH the rules before 2026-11-27 4 am Eastern** (any time after the deploy). If that can't happen in time, THE GRACE is one
   constant (`versions.js#CV_GRACE_END_MS`) — a pass can move it.
2. **THE GRACE lets a modified phone pick v1** for solo / match runs until Nov 27 (it just doesn't write cv) — the owner's spec ("a run
   without it … accepted until Nov 27"). The daily has no grace (ONE COURSE A DAY — the review's M4, your "a day's daily uses the version in
   force at its 4 am"). Shorten the grace?
3. **The difficulty** — a blind cross is now hit 59 % at the first runways (lanes 120–249), 69 % at 250–449, 77 % in the loop; a careful
   player is never trapped (worst wait 3.6 s). Every number is in `tuning.js#RUNWAY` (the lap, the tell, the trail, how often) if it plays
   too hot.
4. THE BOARD keeps v1 and v2 runs side by side (no reset; a v1 best stands).

## THE FINAL RUN (local, the Beelink — my own emulators + `serve.mjs --emu`; Nov 21, finished ~12:05 pm ET — well before the 4 am switch)
- unit `node --test tests/*.test.mjs` **2,487 / 2,487**
- `e2e-jaywalk` FAST **102 / 102** · `e2e-jaywalk-match` FAST **103 / 103** · `--four` **101 / 101** · `--two` **7 / 7** · `e2e-console-fix`
  **55 / 55** · `end-flash` **24 / 24** · `audio-leave` **28 / 28** · `audio-hush` **9 / 9** · `jaywalk-podcast` (15 of 15 sounds with music
  off) · `podcast-sweep` **14 / 14** · `jaywalk-mix` (every guard, 30 cues, none clips) · `jaywalk-bloom` **4 / 4** · smoke **24 / 24**
- `e2e-jaywalk-daily-run` (a DAILY_TEST server) **58 / 58** v1 and **58 / 58** v2 (`JW_CV=0` + a `JW_CV_SWITCH_MS=0` server)
- v2 on the emulator: `e2e-jaywalk` 102 / 102 · `e2e-jaywalk-match` 103 / 103 · the same on the PRE-J2 rules 101 / 101
- `jaywalk-lab --perf` **127 / 127** (the 8-kid tier-2 frame 63 calls, every area ≤ 64 — and two of its sound-sheet counts were J1's stale
  ones: J1 added three sounds to the audition after its own perf run; fixed) · `--j2perf` **16 / 16** (the airfield's 250 ms frame did not
  come back: worst 33 ms)
- `/api`: `server.test.mjs` **72 / 72** · `daily-jaywalk.test.mjs` **7 / 7** · rules `rules.test.mjs` **100 / 100** (+ the J2 cv case)
- Every server I started stopped at the end (the emulators + serve.mjs, by their own PIDs).
