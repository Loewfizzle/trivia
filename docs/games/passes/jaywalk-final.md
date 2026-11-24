# JAYWALK FINAL — GROK'S FIXES · THE FIRST-TAP FREEZE · THE LOAD SNAP · VEHICLE DIRECTIONS (Nov 24 2026)

The owner's prompt (Nov 24) after SMOOTH 4 on his iPhone; his rules: `docs/games/plan.md` "JAYWALK FINAL"; as built: `docs/jaywalk.md` "FINAL".
**No rules change, no gameplay change.** Course rules, replay, proof (THE STAMP at the tap, GO within 5 s) and `database.rules.json` are untouched. **One look change, on purpose:** the dump truck and the snowplow now drive front-first. The inbox: no open entry for this pass at the start, after each group, or before the final run. THE CARD LAB: `lab-export` read, 226 marks, no open FIX. Logs, tables + shots: `Downloads\NEON\jaywalk-final\`.

**NOT MEASURED ON AN iPHONE.** Everything ran on the Beelink (Chromium, its Radeon GPU through ANGLE / D3D11, a 4× CPU throttle). Its shader links are much slower than an iPhone's (the season's ground: ~0.4–1 s here against the owner's 150–190 ms), so the hold below is longer here than it will be on his phone.

## GROUP 1 — GROK'S FIXES
**The uploads, found worse than the review said:** three r160's old `_updateRange` resets itself to −1 after each upload, so a kind left EMPTY (count 0) re-sent its WHOLE instance array every frame, not nothing. Now `gl-upload.js#uploadRange` (three's own `addUpdateRange`) sends only the instances in use, an empty kind sends nothing and is hidden (no program bound), and the ground sends only its laid lanes.

GL calls a frame (`--smooth=gl --ab` the code before, tier 2, 390 @3, the bot playing):

| look | area | bufferSubData before → after | KB a frame before → after | draws | useProgram before → after |
| --- | --- | --- | --- | --- | --- |
| noon | DOWNTOWN | 181 → 86 | 201 → 77 | 64.1 → 64.1 | 23.7 → 18.9 |
| noon | THE DOCKS | 163 → 74 | 180 → 55 | 53.3 → 53.3 | 23.6 → 19.2 |
| autumn noon | DOWNTOWN | 183 → 89 | 200 → 77 | 67.5 → 67.6 | 27.6 → 22.8 |
| night | DOWNTOWN | 181 → 86 | 232 → 108 | 72.6 → 72.6 | 27.8 → 24.0 |
| Dec 24 snow night | DOWNTOWN | 193 → 90 | 253 → 110 | 76.8 → 76.8 | 30.8 → 26.0 |
| Dec 24 snow night | THE DOCKS | 175 → 76 | 210 → 71 | 67.2 → 67.1 | 30.1 → 23.7 |

- **The fog early-out:** the ground shader skips pixels that end as pure fog (`vFog > 0.9999`, tighter than the review's 0.999 so the picture stays the same) and the day's fog bank (its colour is all such a pixel keeps). The night blackout is unchanged.
- **The bloom split:** `prepare()` (occluders, lights, both blurs, offscreen) before the main picture, `composite()` right after it.
- **The GL-call counter** (`kit/gl-count.mjs`): in every `--perf` row and `--smooth=gl`.

## GROUP 2 — THE FIRST-TAP FREEZE
**What the freeze was, here:** on a fast tap, the season pack's ground program and the shadow glow were still linking. Once the run started, its first frame drew them and blocked until the link finished (`getProgramInfoLog` 419 + 66 ms in one frame here). A 0.5 s hold alone only moved the freeze to the first frame of play on this machine. **In the game it was worse:** the season was applied only at GO, so the season's ground started linking right after EVERY first tap (fixed by Group 3, which applies it on the start screen).

**What changed:** a first tap that beats the warm-up is remembered and the start HELD on the still screen (`night.js#startBusy`, `view.js#startGate`, the lab the same). The words go at the tap, THE STAMP goes at the tap, and only the solo GO waits (its 4 s timer re-armed after the gate). For 0.5 s the hold is silent and also waits for the loaders' last steps. **A call made (OPEN FOR BEN 2):** past 0.5 s, a shader link still in flight keeps the hold, with a quiet GETTING READY line, 2.5 s at most. The daily needs no hold (its server lead gives a 3 s still count). The veil's twice-a-second throttle now counts a warm-up owed too (Grok's P0-4).

**Found on the way:** `--smooth=first` filtered its GL events on the wrong field, so every run had reported 0 links and 0 KB. It now reads them again, and has a fast-tap option, autumn noon, and the tap → first tick.

**The measure** (`--smooth=first:3:4:150`, a NEW browser each run, the tap 150 ms after the page is up, 4× CPU):

| scene | code | worst frame from page load | BIG in play | worst in play | tap → first tick |
| --- | --- | --- | --- | --- | --- |
| Dec 24 heavy night | before | 1,500 ms | 2.7 | 100 ms | 356 · 1,501 · 1,497 ms (the link blocked the run's first frames) |
| Dec 24 heavy night | after (final code) | 600 ms | 1.3 | 83 ms | 1,704 · 1,558 · 1,581 ms (held, GETTING READY) |
| autumn noon | before | 1,317 ms | 1.7 | 67 ms | 1,225 · 1,259 · 1,380 ms |
| autumn noon | after (final code) | 633 ms | 1.0 | 50 ms | 1,557 · 1,581 · 1,552 ms |

- **Pipelines first drawn in play: 0 in every run, before and after.** No link finishes in play any more.
- **NOT REACHED: "worst frame in play ≤ ~40 ms".** One frame of ~50–100 ms is left at the run's first ticks. It is NOT a link: its scene draw is under 20 ms and it has no GL time. It sits outside the page's own JavaScript (the GPU process or a GC on this machine), and the code before has the same frame. Not fixed; the owner's meter is the judge.
- **A normal tap** (`--smooth=warm:1`, the tap 3.1 s after the page): no links in play, the first 10 s 1 BIG frame (worst 50 ms), tap → first tick 63 ms (autumn noon) / 178 ms (Dec 24 night, a short hold), a warm page 34 ms.

## GROUP 3 — THE LOAD SNAP
**The cause:** the lab applied the season when its pack landed (~1–1.5 s after the scene first drew), and the game applied it only at GO, so the start screen showed plain noon first. The time of day on the phone's sun also landed a moment after the first frame.

**What changed:** a fresh solo / daily scene (and the lab) stays under a cover of its look's own haze (the fog colour, so no black flash by day) until its FINAL look is in: the models, the time of day on the phone's sun, today's season (now applied on the start screen; the run's own day is the same one). Then it shows ONCE (a 280 ms fade), 2 s at most. A pack later than that eases in under a still of the picture before it (1 s), only while the start screen is up. A match and a parked PLAY AGAIN scene keep their own path.

**The check** (`--smooth=snap`, every painted frame of a cold page logged): autumn noon, golden, Dec 24 snow day + night, summer: shown 0.41–0.73 s after the page, already in season, no snap. With the pack held 3 s (autumn noon, Dec 24 night): shown at the 2 s cap without it, then eased in. **20 / 20.**

## GROUP 4 — VEHICLE DIRECTIONS
- **The dump truck drove backwards:** its cab sits at the source file's −z. It is turned 180° in the vehicle table (`build-jaywalk-assets.py` VARIETY_SRC). **The snowplow** is built from the re-packed dump truck, so it was backwards too (its blade on the bed end, its beacon over the bed). Rebuilt from the turned dump truck, its blade and beacon now sit at the cab and lead (`VARIETY.plow.bar` 0.995). `VARIETY_REV` 3, so every phone fetches both fresh. The other 15 vehicle files came out byte-identical from the rebuild.
- **Every vehicle checked by eye, both directions, day + night** (`jaywalk-lab.mjs --vb2=dirs`): police, SUV, sports sedan, taxi, sedan, hatchback, van, box truck, city bus, bendy bus, delivery, forklift, garbage, tanker, semi, ambulance, school bus, fire truck, airport tug, salt truck, dump truck, snowplow. All front-first, headlamps at the front, tail lamps behind. Some night pairs were not found on screen in the seeds tried; the lamps are placed from the lane's direction, so night follows day.
- **The guard** (`tests/jaywalk-final.test.mjs` + `tests/fixtures/vehicle-fronts.mjs`): each model's z-profile (mean z of all / upper / lower vertices) is pinned from these checked files. A model rebuilt turned round flips every sign. The snowplow's body is compared with the turned dump truck. Both checks are red on the old files. (A lamp-colour detector was tried first: white bodies and a red tanker make it no judge.)
- Shots: `Downloads\NEON\jaywalk-final\dirs\` (`dump-*`, `plow-*`, the sheets `review-day-*.png` / `review-night-*.png`).

## GROUP 5 — THE FINAL RUN (local, the Beelink, fresh emulators + `DAILY_TEST=1 JW_CV_SWITCH_MS=0 serve.mjs --emu`)
- unit **2,649 / 2,649** · `e2e-jaywalk` FAST today **122 / 122**, Dec 24 **123 / 123** · `e2e-jaywalk-match` today **107 / 107** (the three side by side)
- **THE SAME PICTURE** (`--smooth=same:noon+autumn+snowNight+golden+night --ab` the code before): 70 frozen frames. **68 within the allowance, 63 at 0.0000 %.** Two cases differ:
  - **Dec 24 snow night, THE AIRFIELD:** 0.058 % (a 46 × 52 px patch at the frame's right edge, where a winter truck enters). It is the turned snowplow, a change made on purpose; the old code against itself there is 0.0000 %.
  - **Noon DOWNTOWN tick 2401–2405:** 0.26 % in some runs and 0.0000 % in others. The new code's six frames are pixel-identical to the old code's frames from a run where they matched, so the frame that differs comes and goes in the old code's page too; not this pass.
- `--smooth=snap` **20 / 20** · `--smooth=warm:1` and `--smooth=first` (the tables above) · `--smooth=gl` (Group 1's table)
- `jaywalk-lab.mjs --perf`: see "THE PERF RUN" below
- rules: not touched · `/api`: not touched

## OPEN FOR BEN
1. RE-PUBLISH: nothing (no rules change).
2. **A call made — the hold past 0.5 s.** Your rule said "≤ 0.5 s" and also "no loading text unless it ever exceeds 0.5 s". I built it as: silent up to 0.5 s; if a shader link is still in flight then, the start keeps holding with a quiet GETTING READY line, 2.5 s at most. That avoids the mid-hop freeze on slow phones. On your iPhone (150–190 ms left at a fast tap) the line should never show. To make 0.5 s a hard cap instead, set `START_HOLD_MAX` to 500 in `js/games/jaywalk/night.js`.
3. **The phone check** (open each FRESH, tap straight away, a 10 S TEST): the first hop should start cleanly, with no freeze in the first second. One ~50–100 ms frame at the run's first ticks is still there on the Beelink, in the code before too, and is not a shader link; your meter says whether the iPhone has it.
