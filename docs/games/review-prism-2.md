# FABLE REVIEW 2 — PRISM DROP: THE DROP + THE SKINS + THE SHARE CARDS (Nov 14 2026, read-only)

**Summary**
1. THE DROP's anti-cheat holds: I found no way to forge a score, count a run twice, get the day's seed in practice, or crash the function. The server's replay accepted every honest run I gave it, from Chromium and from Safari's engine.
2. But an HONEST run can be lost three ways, all around PAUSE and the page hiding. Each needs a small timing collision or a lost request, each is proven on the emulators, and each costs the player the day (no score, no SWEEP).
3. THE SCHEDULED GO-LIVE, the per-day SWEEP / PERFECT WEEK set, the points curve, the throwaway gate and the solo pause all work as decided.
4. The share cards follow the one rule and leak nothing; four real look bugs (COAST CLEAR's lamps off-centre, THE PASSWORD's day doors black, THE DROP's own card off the rule, old iPhones lose letter-spacing).
5. The skins rotate, pin and load correctly and read apart at a glance; the "blocks grow" Ben saw is the preview's forced clear. Two things outside THE DROP need a pass: SKINS 2B's tap-guard made the city's edges dead on desktop / iPad / a sideways phone (C1, live now), and the preview's iPhone silence has no proven cause yet (§9).

**THE DROP — SAFE TO GO LIVE: NO** — because a player who taps PAUSE, takes a call or locks the phone at the wrong moment can lose the day's run with pauses still left (M1–M3). Nothing is wrong with the scoring or the cheat checks. One fix pass (Group A below, about 2–3 h) and it is safe; then tap GO LIVE AT THE NEXT 4 AM.

## WHAT BECAME OF EACH FINDING — PFIX-3 (Nov 14 2026; docs/games/passes/pfix-3.md)
- **M1** — FIXED IN PFIX-3 (Group A, `fe48ce19`): a tap's pause waits for the upload in flight; no answer / no `pa` is never "paused".
- **M2** — FIXED IN PFIX-3 (Group A): a pause never waits on its chunk (in step by the tail, or `resync` + the pause); chunks keyed `{offset}_{length}` — a shorter one never replaces a longer one.
- **M3** — FIXED IN PFIX-3 (Group A): a late `ppause` with a pause left = a backdated pause (one of the 3); every player pause stands at its chunk's tick.
- **C1** — FIXED IN PFIX-3 (Group A2, `8ed112f8`): `ui/layers.js#touchInCity`. NOTE: a real PHONE held sideways shows the TURN YOUR PHONE UPRIGHT card (index.html `#ns-turn`), which owns the touch by design — the review drove the title preview, which has no such card.
- **S1** — FIXED IN PFIX-3 (Group A): the record is read first; a chunk is stored only for a run in flight when the judge would take it.
- **S2** — FIXED IN PFIX-3 (Group A): the room's pause is in step though its chunk already landed; the close sends no checkpoint behind it.
- **S3** — FIXED IN PFIX-3 (Group B, `e78d6e83`): a refused finish is scored at its last provable point, marked `rf`, reported, and said on the ticket.
- **S4** — FIXED IN PFIX-3 (Group B): the largest clock offset wins (`clockOffset`).
- **S5** — FIXED IN PFIX-3 (Group B): the finish never gives up while the card is open; `online` / the page showing wake it.
- **S6** — FIXED IN PFIX-3 (Group B): `engine.js#GRAVITY_MS` — a table of node's exact values, every bit pinned.
- **S7** — FIXED IN PFIX-3 (Group C, `4f4735da`): the lamps centred on their ink + capped by the column.
- **S8** — FIXED IN PFIX-3 (Group C): the look passed into `door()`; day fills; the labels ≥ 4.5:1 (6.06 / 5.65).
- **S9** — FIXED IN PFIX-3 (Group C — Ben's call: yes): THE DROP's own card is on the one rule.
- **S10** — FIXED IN PFIX-3 (Group C): `spacedText` / `spacedWidth` — by hand where the canvas has no letterSpacing.
- **S11** — FIXED IN PFIX-3 (Group C — Ben's call: built before the tap): `prepShare`; no file sharing / refused → the card shown in a sheet (+ the add-on: no message over it).
- **S12** — FIXED IN PFIX-3 (Group D, `3ea6d1d4`): `logic.js#attackSent` — client only; the rule-side ledger still rides the next rules pass.
- **S13** — FIXED IN PFIX-3 (Group F, `3ea6d1d4`): `sfx-key.js` — a note on the song's root / fifth, a chord where it is all in key, the lock's wander ±20 cents.
- **K1** — FIXED IN PFIX-3 (Group F): the kick is `composite: 'add'`. **K2 / K3** — FIXED: `&heavy=1` fires real clears; re-measured 59.6–60 fps at 4× CPU (galaxy, neon, pixel). **K4** — FIXED: the tiles one a frame. **K5** — FIXED: 8 px + the skin's own arrow. **K6** — FIXED: the NIGHT LOOK check pins its skin.
- **DISCONNECT (§8)** — FIXED IN PFIX-3 (Group D, test only): the host kept alive until the kill + a check that she is in.
- **N4** — FIXED IN PFIX-3 (Group B). **N6** — FIXED IN PFIX-3 (Group C — Ben's call: bottom-aligned; the first section's breath). **N7** — the flame by day + THE DROP's bare domain FIXED IN PFIX-3; THE PASSWORD's missing "Nº" + "THE END" at 8:00 are LEFT OPEN.
- **C2, C3** — NOT in PFIX-3 (the city chat's). **N1, N2, N3, N5, N8 (but the freed canvas of a prepared card), N9** — LEFT OPEN.
- **§9, the previews' silence** — cause still not found; PFIX-3 adds the SOUND READOUT (`&sound=1`) + restarts the song clock at the tap, so one screenshot says why.

How I worked: read the docs + pass logs + the code named in the brief; ran my OWN emulators + two `serve.mjs --emu` servers; wrote scratch scripts outside the repo (none committed); four read-only sub-reviews (skins, share cards, tap-guard + sound, the two old PRISM reds), whose main claims I re-checked in the code or the pixels. Nothing in `js/`, `api/`, `css/`, `tests/` or the rules was changed.

---

## MUST-FIX — THE DROP itself (an honest run is lost)

### M1. PAUSE tapped while a checkpoint is uploading: the phone says PAUSED, the server never paused
- **What happens:** the card reads `PAUSED · 2 LEFT`, the board is hidden, the player rests. The server's clock keeps running. On RESUME the phone learns the truth and the board fast-forwards through the whole "pause" in one frame — pieces fall and lock by themselves, the rows rise. Late in a run that is a top-out.
- **Where:** `js/games/drop/view.js:121` — `send()` returns `null` when another upload is in flight; `:159` — `pause()` treats that `null` as success (`else pzOk = true`).
- **Proven** (the real app, emulators): `window.__drop.send(); window.__drop.pause()` → phone `paused: true, pzOk: true`; the server's record `pz.n = 0`, no open pause. 25 s later RESUME → **the run jumped 29.2 s of play in 1.5 s**.
- **How often:** only when the tap lands inside a checkpoint's round trip — one every 30 s of play, plus one on the run's first frame. At 0.2–1 s a round trip on a phone that is roughly 1–3 % of pause taps.
- **Fix:** `pause()` waits for the upload in flight, then sends its `ppause`; a `null` / no `pa` answer is never "paused" (un-pause locally, give the pause back). Same care in `back()` (`:184`).

### M2. The page hides while a checkpoint is uploading: the run ends with 3 pauses left — or can't be checked at all
The hide's pause is sent with keepalive and skips the "one upload at a time" guard (`view.js:121`), so two uploads with the SAME log offset race to the server.
- **Order A — the checkpoint lands first:** the pause call is "out of step", so `drop-judge.js:128` answers `resync` and returns BEFORE the pause is granted. The phone reads that as "no pause granted" (`view.js:170`) and lets the clock run. Back after more than 20 s → the run is ended `late`.
  **Proven 3 of 3** in the real app: 3 pauses left, hidden 27 s → `THE DROP 0:22.0 · 4 LINES · SCORED`, the record `e: 1, o: 'late'`.
- **Order B — the pause lands first:** the late checkpoint carries a SHORTER chunk from the same offset. The chunk is stored before any check, keyed by its offset only (`api/daily.js:218–224`, `api/_lib/drop.js:45–50`), so it OVERWRITES the longer one. The record now covers 311 characters, the stored log 298: a hole. At the finish: `log_missing` → 422 → **"THIS RUN COULDN'T BE CHECKED"**, no score.
  **Proven** over /api: `S1` in my script — finish `422 refused`; `today` then says `started: true` for the rest of the day; a new start gets an ended run with an empty log.
- **The same hole without a hide:** a checkpoint that times out on the phone but still reaches the server after its longer retry (`js/profile/api.js` aborts at the timeout; the request may already be on its way). Proven: `S1b` → finish refused.
- **Fix (three small parts):**
  1. `drop-judge.js#act`: a `ppause` / `pause` whose chunk is out of step STILL pauses (answer `resync` + the pause), so the phone only has to re-send the chunk later.
  2. The chunk store never lets a shorter chunk replace a longer one: key it `${at}_${length}` (`joinChunks` already takes the furthest-reaching piece) and write it only when the record is in flight and `at ≤ record.len`.
  3. `view.js`: a hide during a flight sends its pause after the flight (or without a chunk).

### M3. The hide's pause call never arrives: the run ends, though a refresh in the same spot survives
- **What happens:** the pause on hide is one keepalive request. If it is lost — no signal at that moment, the phone freezes the page first, or the ID token needs its hourly refresh before the fetch (`api()` awaits the token) — the phone asks again on the return (`view.js:181–185`). By then the chunk is more than 20 s behind the server's clock, so `drop-judge.js:93–98` ends the run `late` at the last checkpoint + 15 s. The player had all 3 pauses.
- **Proven** over /api (`S4`): hide at 55.0 s of play, pauses used 0, the call lost, asked again 60 s later → `e: 1, o: 'late'`, scored at **42.0 s**. The same gap as a REFRESH → the run lives, one pause used.
- **Why it is a must:** the owner's rule is "hiding the page auto-pauses and spends one". A call, a lock or a tunnel is exactly when a request gets lost.
- **Fix:** in `act`, a `ppause` that would end the run `late` while a pause is left becomes a BACKDATED pause instead (`at = now − (due − the chunk's time)`, one of the 3, inside the 20 minutes) — the rule `begin()` already uses for a refresh (`drop-judge.js:157–160`). It gives a cheater nothing a refresh does not already give.

## MUST-FIX — the city (LIVE NOW; it does not block THE DROP)

### C1. The tap-guard made the city's edges dead on anything wider than a phone held upright
- **What happens:** on desktop, an iPad and a phone held sideways, taps on the city BESIDE its centre column do nothing: the door (JOIN), the game signs out there, sightings, the cat / the UFO, the desktop hover glow. A phone held upright (390 / 430) is not affected.
- **Where:** `js/screens/title-taps.js:50` — rule (c) "the touch began outside the city's root" tests `T.els.root.contains(target)`. The root is the title's COLUMN (560 px wide; 1180 px on a big screen — `css/title.css:31, 255`); the city's canvas fills the whole window on `<body>`, so beside the column the touch lands on `#stage` and counts as "a screen on top".
- **Proven:** the same taps with `title-taps.js` as it was before `097dcc34` vs now — 844 × 390 touch: the door at [62, 308] opened JOIN before, nothing now; a sign at [86, 260] the same; 1440 × 900 mouse: the door's left edge [110, 788] had the pointer + JOIN, now neither; 820 × 1180 (iPad): a sign at [758, 364] the same. My own check: at 1440 × 900 the root spans x 130–1310 and `covered()` is `true` at [110, 788] with nothing open. Out there are 132 of 363 hit points at 844 × 390 (all 30 of the door's), 472 of 2,082 at 820 × 1180, 138 of 995 at 1440 × 900.
- **Fix:** count the root's ancestors and the scene's own wrap as the city — `inCity = root.contains(t) || t.contains(root) || sceneWrap.contains(t)`; add a 1440 × 900 and a sideways case to `e2e-daily` / the harbor suite (DESKTOP COMES FREE: every pass checks 1440 × 900 — this one's test ran at phone sizes only).

---

## SHOULD-FIX

### THE DROP
**S1. Anyone with a profile can fill the database with junk log chunks.** The chunk is written before the server checks that a run exists (`api/daily.js:218–226`: the write sits in the same `Promise.all` as the reads; `not_started` is thrown after). Proven (`S3`): a profile with NO run sent 21 refused calls → 21 chunks, 504,000 characters stored under `dly/drop/{day}/l/{pid}`. The call budget allows 400 calls per 10 minutes × 24 KB ≈ 1.4 GB a day from one account; Firebase's free plan holds 1 GB. THE PRUNE only removes them 9 days on. **Fix:** read the record first; store a chunk only for a run in flight, `at ≤ record.len`, `at ≤ LOG_MAX` (rides on M2's fix).

**S2. THE ROOM WINS can lose its free pause.** `daily.js:80–86` sends the room pause, then closes the run; the close sends a checkpoint with the same offset (`view.js:268`). If the checkpoint commits first, the pause gets `resync` and is not granted (`drop-judge.js:128`), and `retryWhile` takes the 200 as success (`daily.js:460`). Proven over /api (`S2`): record not paused; RESUME YOUR DAILY 6 minutes later cost a PLAYER pause ("LAST CHECKPOINT · 1 PAUSE USED"); with no pause left it would end the run. In the real app on my one-process local server the pause won 3 of 3 (all three phones came back to "THIS PAUSE IS FREE") — on Vercel the two calls run in separate instances and the pause does more reads first, so I can't promise the order. **Fix:** M2's part 1 covers it; also don't send the closing checkpoint right after a room pause.

**S3. A refused finish is a dead end.** `api/daily.js:374` throws; nothing is stored. TODAY shows RESUME all day (`:274–275`), a re-opened run shows "SENDING YOUR RUN…" forever (the driver starts `ended` and never calls `finish()` — `view.js:85`), and the owner hears nothing. **Fix:** on a refusal, score the run at the last point the stored log CAN prove (or the floor), mark the record (`rf: reason`), report it to the error log, and say "THIS RUN COULDN'T BE CHECKED" on the ticket.

**S4. A slow answer freezes the board.** `view.js:110` re-estimates the phone's clock offset from EVERY answer (`off = now − Date.now()`), so an answer that took 2 s moves the run's clock back 2 s: gravity stops, at most 24 inputs land in the frozen tick, a SLAM waits. The next quick answer jumps it forward again. **Measured** in the real app (one checkpoint with 2.5 s of latency): the run's tick stood still for 2,440 ms from the moment the slow answer arrived, then jumped 2.57 s of play in one step after the next quick answer. On a phone every latency spike is a freeze, then a lurch. **Fix:** keep the largest offset seen (`off = max(off, new)` — latency only ever makes the estimate too small).

**S5. The finish gives up.** `view.js:140–150` tries 6 times (about 21 s plus timeouts) and then shows "SENDING YOUR RUN…" for good — no retry when the signal comes back. The run then waits to be closed as abandoned, or a reload resumes it at the last checkpoint. **Fix:** retry on `online` / on the page showing, with no limit while the card is open.

**S6. Safari's engine computes gravity with different last bits than the server.** `engine.js:75` uses `Math.pow`. Measured in Playwright's WebKit against node: 8 of 12 levels differ in the last 1–3 bits (level 4: `…f3d1` vs `…f3d0`). I found NO run that diverged — three whole WebKit bot runs (209–268 s, up to 948 pieces) replayed in node to the same lines and pieces, and 2,000,000 ticks of free fall per level never changed a row step (the closest call was 3.2e-6 ms; the gap is ~1e-13). But the whole design rests on "bit-identical", and real iPhones may differ again. **Fix:** a 12-number table (node's exact values) instead of `Math.pow` — changes nothing on the server, removes the question.

### THE SHARE CARDS (pixels measured at 1080 × 1350; all confirmed in the images)
**S7. COAST CLEAR's lamps are off-centre everywhere and stick out of the column with two dailies.** SHARE TODAY with 2 dailies: the lamps span x 85–1030 (the column and the foot line are 150–930), centre +18 px; 3 dailies +12.5 px; its own card +16 px. Every other band on every card is within 2.5 px. Cause: `js/games/coastclear/share.js:67–70` centres a 32-unit box whose ink is 4.6–31.5; `:113–114` sizes the lamps by the strip's height only. **Fix:** centre on the ink, cap the size by the column width; re-take the frozen copies on purpose (they hold the same offset, so share-same can't see it).

**S8. THE PASSWORD's own card by DAY draws night doors.** A room never opened is a near-black slab on the sunny card; a held door is a muddy maroon. `js/games/password/share.js:52` tests `L === LOOK.day`, which is never true (`tokens()` returns a copy), and `:50–52` hard-code the night fills. The failed room's label is about 2.75:1 on the sky. **Fix:** pass the look into `door()`; day fills; re-take the expected copy.

**S9. THE DROP's OWN card is not on the one rule.** Order = sign → name + date → board → time → lines; its name is PRISM's ice-blue, not WHITE (Ben's 11:16 am add-on says white, own cards included — `js/games/drop/share.js:68`, `kit/share-run.js:71–73`); the time is Orbitron 78 px, not the kit's big time (Orbitron's 0 reads as a block — see 8:00); "101 LINES" sits 20 px above the foot line. It is still pass B's SHARE YOUR RUN card — **Ben's call** whether it joins the rule.

**S10. iPhones before iOS 18.4 draw every card without letter-spacing** (canvas `letterSpacing` arrived in Safari 18.4; emulated by removing the property): names shrink (THE PASSWORD 480 → 383 px) and sit 4–8 px right of centre. Readable, not the approved look. **Fix:** one helper that draws letter by letter when the property is missing. *(Rests on Apple's release notes + an emulation — not seen on a phone.)*

**S11. The share sheet is opened after waits — on an iPhone it may do nothing.** SHARE TODAY: tap → a lazy import → an /api call (THE DROP's replay) → more imports → `toBlob` → `navigator.share`. Safari can refuse a share that comes too long after the tap; the code then falls through to a download click and shows nothing (`js/daily/share.js:127–135`; the callers ignore the result). No busy guard: a double tap starts two. **Check on the iPhone first** (Safari + the home-screen app, on cellular). **Fix if it fails:** build the card before the tap; on a refusal show the image with a second SHARE; add the toasts `ui/final.js` already has.

### THE OLDER BUGS (§8)
**S12. The REFRESH one-attack red is real, rare for players, and a 1-in-4 flake for the suite.** See §8 — a client-only fix, no rules change.

### SOUND, THE SKINS, THE CITY (their detail in §9, §5, §7)
**S13. The pitched skin sounds are played as recorded, never in the song's key** — galaxy's C clashes on the D-major night song; pixel's G and galaxy's C clash on three of the five day songs; the ±3 % wander is ±51 cents (§9).
**K1–K6** — the one-frame board pop on a slam-made big clear · the preview's forced clear · the 60-fps number measured on forced clears · Settings loading every skin · ARCADE PIXEL's 6-px lettering · the full suite's NIGHT LOOK check red two runs in three (§5, THE SUITES).
**C2, C3** — a leaked layer now kills the city (THE RADIO, `?preview=card`) · a sheet closed by its own opening tap on Android-like touch (§7).

---

## NICE
- **N1. Room pauses are unlimited in number** (60 minutes in all, `drop-judge.js:139–142`): a friend starting a game is a free pause each time. Fine for friends; cap it (2 a run) before the public.
- **N2. The 4 am sweep settles every unfinished run inside the first caller's request**, one after another (`daily-close.js:49–75`; `api/daily.js` has 10 s). Fine now; it is already on the BEFORE-PUBLIC list (~500 runs a day).
- **N3. CANCEL in the last 30 s before 4 am** may not reach a warm daily function (the schedule is cached 30 s per instance — `dailies.js:57, 66–70`; the admin function clears only its own cache). A start in that half-minute would open a run on a daily that is then off. Don't cancel at 3:59.
- **N4. A run settled two days late can skip its streak / XP step.** `progress.js:331–338` keeps the two newest days and can delete the run's OWN day; `:288–290` then throws (`TypeError … reading 'x'` — reproduced by calling `dailyStep` with two newer days). The score is already stored by then, the stats step is lost. I could not reach it through the normal flow (the sweep runs before a player's first finish of that day); one line fixes it (never delete `day`).
- **N5. `/admin`'s week back-fill uses ONE daily set for every day** (`js/core/board-fill.js:22, 36`): run after the go-live, it would not count THE SWEEP for the days that had two dailies. Pass each day's own set. *(the dailies chat)*
- **N6. THE PASSWORD's grids in SHARE TODAY are top-aligned; the approved mockup shows them bottom-aligned** (`password/share.js:102–108`) — Ben's call. Also: the first section starts 23 px under the flame (mockup ≈ 100); with two dailies everything scales 1.45× and the names (58 px) are bigger than the date.
- **N7. By day the streak flame keeps its night glow** as a pink-grey smudge (`share-today.js:63, 73`). THE PASSWORD's own card never shows its "Nº" (`password/view.js:252` passes no `dayNo`). THE DROP at 8:00 prints "THE END · 250 LINES" — the last result word on a card. THE DROP's share text carries `https://`, the others the bare domain.
- **N8. The share canvases skip `ui/canvas-safe.js` and are never freed** (`js/daily/share.js:12–13`, `drop/share.js:96–100`, `prism/share.js:27–28`): 5.8 MB a card, up to 9.3 MB more for THE DROP's temp at 3×, left to the garbage collector.
- **N9. TODAY's SWEEP meter** (three bars with round ends) is the one capsule-like shape left on the DAILY screen — older than the skin passes; for "THE OTHER PILLS" list.

---

## 1. THE DROP — what I checked, point by point
| the brief's point | result |
| --- | --- |
| the server replay — the same pure engine, once per run | ✔ `judgeFinish` replays the joined log once at the finish / the close of an abandoned run; a checkpoint is only size / order / time-bounded. Finish over /api: 36 ms for a 193-s run. |
| deterministic across browsers | ✔ in practice (Chromium + WebKit runs replayed in node); **S6** for the last bits. |
| the slow-motion check, both ways | ✔ ahead of the clock + 4 s → `too_early`; more than 20 s behind → ended at the checkpoint + 15 s; again at the finish. A cheater gains at most 20 s of lag over a whole run. |
| the 100 ms input floor | ✔ slam ≥ 12 ticks apart, ≤ 24 inputs a tick, ≤ 160 a second — the phone and the replay use the same counters (`drop.js#floorOk`). |
| the guaranteed end by ~8:00 | ✔ `END_TICK` 57 600; 259 rows in all — 45 by 4:00, 88 by 6:00, 159 by 7:00, one every 0.6 s after. |
| checkpoints (30 s + pause / hide), resume from the latest | ✔ e2e-drop 34 / 34, daily-drop.test 11 / 11. **M2** is the collision. |
| an abandoned run scored at its last checkpoint | ✔ by the player's next `today` and the day's sweep. |
| 3 pauses, server-timed, 20 min, board hidden | ✔ … except **M1**. |
| hiding = an automatic pause; none left + away > 20 s | ✔ as decided … except **M2**, **M3**. |
| a refresh costs one | ✔ |
| DFIX1 — a run keeps its own day across 4 am | ✔ (`dayOfCall`: today or yesterday; the phone remembers the day) |
| ONE stored `high` (tenths × 1000 + lines), first finish only | ✔ |
| points 10 + 90 × (t / 8:00)^0.6 | ✔ checked every tenth 0:00 → 8:00: never fewer for a longer run, min 10, 8:00 = 100 (0:30 → 27 · 2:00 → 49 · 4:00 → 69). |
| practice / PLAY NOW never gets the day's seed | ✔ a room's seed is random per match (`prism/index.js:52`); the day's seed leaves the server only in the answer to `start`, which starts the one run. |
| requests + bytes per run | a 193-s bot run: **9 calls**, 6.7 KB up, 1.5 KB down, the log 6,031 chars in 7 chunks, the record 163 B. An 8-minute run ≈ 20 calls (+ 2 a pause), a log of 15–30 KB until THE PRUNE. 200 players a day ≈ 4,000 calls a day ≈ 120,000 a month for THE DROP — well inside the free plans as I know them (check the dashboards). **S1** is the storage risk. |
| cheat / double-count / crash | no forged score, no double count (`r` is first-write-only, the stats step is keyed by day + game), no crash found. |

**What a cheater can still do (all known + accepted for friends):** a script that plays at human speed; think with the board visible during a pause (20 minutes); rewind up to 30 s three times by blocking the hide's request and reloading; learn the day on a throwaway profile, practise it, then play the real one (on the BEFORE-PUBLIC list).

## 2. THE SCHEDULED GO-LIVE
- ✔ `progress/dlive/drop = { from: <the next streak day> }`, server-only; the day key decides on every call, so it opens AT the 4 am turn, never mid-day; CANCEL works until then and is refused after (`already_live`); no deploy (the phone's list of dailies is the server's `today`, never `config.js`'s `on`). Between midnight and 4 am "the next 4 am" is the coming one. `daily-golive.test` passes.
- ✔ **A page open across that 4 am:** `js/daily/today.js#armTurn` re-reads `today` 1.5 s after the turn (a sleeping phone on waking) — the third ticket and the dock count appear by themselves. A PASSWORD / COAST CLEAR run in flight keeps its own day.
- **N3** is the one edge.

## 3. THE DAILIES CHAT's CHECKLIST
- ✔ **THE SWEEP + PERFECT WEEK by THAT day's set:** `finishRun` passes `liveFor(day)` (`api/daily.js:402`); yesterday (2 dailies) stays swept, a yesterday run finished after the go-live closes yesterday with 2; the run chain continues across the go-live day if all three are played that day.
- ✔ **PENTHOUSE's close, TOP x %, DAILY POINTS for THE DROP:** the generic close (`daily-close.js`) — ties at the cutoff all win, one close per daily per day, a late finish re-ranks once and can only add.
- ✔ **THE THROWAWAY GATE:** a same-day profile's run is kept, the streak + XP as usual, out of the histogram / the table / the points (`counts` in `finishRun`).
- ◐ **THE ROOM WINS mid-run:** in the real app, three phones mid-DROP, the host starts a game → all three paused free (`kd: 'r'`, 0 pauses used), the banner, RESUME YOUR DAILY → "YOUR ROOM STARTED A GAME · THIS PAUSE IS FREE". **S2** is the order that loses it.
- ◐ **DFIX3's audio fade over PRISM's songs:** by reading — the songs run through the engine's music bus → master, and the master is what fades on hide (`audio/engine.js:332–364`). I can't hear a hum or a pop here: **Ben's ear, on the iPhone**.
- ✔ **TODAY with 3 tickets** at 390 × 844 + 430 × 932, night + day, three states: all three tickets 16 px from both edges, nothing clipped, no scroll, no small tap target.

## 4. SOLO
- ✔ `e2e-playnow --only pause` in WebKit, 7 / 7: a SURVIVAL hidden 60 s stood still (8.1 → 8.1 s, pieces and rows too), the 3-2-1, then on; the result = time played (24.3 s, never the 92 s of wall time); SCORE RUSH's song + clock resume together.
- ✔ The server's check (`match-report.js#survivalCap`): a solo SURVIVAL time past the row after the next one its engine took (+ 5 s) counts as an empty run. Multiplayer AWAY is untouched (a room of 2+ never pauses).

## 5. THE SKINS
No must-fix. Headless Chromium on the mini PC only — no real phone, no WebKit.

**Ben's question — do the blocks grow or jump on a real 4-line clear?**
- **What he saw in `&heavy=1` is the preview's forced clear, not the game.** `view.js:1628–1634` (`fireFx('clear')`) invents a clear event without removing the rows; `onClear` then rebuilds "the board before the clear" by putting four rows back UNDER a stack that never lost them (`view.js:542, 552`; `neonfx.js:15–22`). Measured: the top of a 7-high column goes 7 → 11 → 7 in the forced mode (held ~0.3–0.5 s); with a REAL clear 7 → 7 → 3, never upward, in all six skins. It looks new because paper, pixel and galaxy use that hold and crayon / watercolor don't. → **K2**.
- **But there is a small real one, and it is older than the skins:** on a SLAM-made 4-line clear / twist / perfect clear the board snaps to scale 1.016 in ONE frame (about +5 px wide, +10 px tall at 390), then eases back. THE BOARD KICK (a 120 ms Web Animation, `view.js:1574–1579`) and the big clear's pulse (`css/prism.css:112–114`, scale 1.018 over 0.42 s) run on the same element; the kick hides the pulse while it runs, so the pulse appears mid-way when the kick ends. The same code is at `a5248f97` and `219a018a` — **not a regression**. A soft-landed clear ramps smoothly. Crayon, watercolor, galaxy, neon; paper and pixel never scale. → **K1**.

**Findings**
- **K1 (SHOULD-FIX) — the one-frame pop** above. Fix: `composite: 'add'` on the kick, or start the pulse when the kick ends, or put them on two elements.
- **K2 (SHOULD-FIX, tool only) — the preview's forced clear** above. Fix: make it a real clear (write the rows, lock a piece), or skip the hold for a made-up event. Until then `&heavy=1` shows a jump the game does not have.
- **K3 (SHOULD-FIX) — the "60 fps with a 4-line clear" number was measured on forced clears** (no slam, no kick, no real collapse). With the tool as it is, every skin holds 60 at 4× CPU (CPU p95 3.9–6.2 ms a frame). With REAL slam clears every 0.7 s at the top tier: pixel 60 · paper 59.5–60 · watercolor 58.7–59.8 · crayon 55.7–58.2 · galaxy 55.4–59 · **neon 44.6–57.5**; at the lowest tier all 58.3–60. Read with care: run-to-run spread is large, most long frames had little CPU time (this machine's compositor), and neon's light path is older than the skins. Galaxy shows a repeating 13–19 ms frame about 40 ms after a clear. Fix: make the heavy set fire real clears, then re-measure galaxy + neon — and on a phone.
- **K4 (SHOULD-FIX) — opening Settings loads every skin's code and hitches.** `settings-panel.js:159–165` → `picker.js:10` → `skins.js` = 25 modules / 265 KB (HOLD'EM's picker: 4 / 23 KB), on any Settings open, in the city too. All 8 tiles paint in one frame; the crayon tile alone costs 143 ms at 4× CPU; long tasks of 87–164 ms on opening. Fix: one tile a frame; warm the crayon tooth in slices.
- **K5 (SHOULD-FIX) — ARCADE PIXEL's small lettering:** HOLD / NEXT at 6 px (`css/prism.css:852`; the other night skins 7.5), the INCOMING tag 7.5, the callout's second line 8.5 — about 1 mm on a phone; Press Start 2P has no "→", so "+5 → CHARLIE" falls back to a thin glyph. Suggest 8 px (the font's own grid) + a pixel arrow.
- **NICE:** watercolor's incoming rows mid-rise are pale grey on cream and galaxy's dark rock on a dark well (the leading line + the tag carry them; both read once due) · the tiers never give the extras back (`view.js:807, 812` — one slow 1.5 s turns the sky / scanlines off for the match) · PRISM's 2D canvases still skip `ui/canvas-safe.js` (older than the skins; the new code follows it) · per-frame strings + a gradient a frame (`view.js:969`, `galaxyfx.js:164`, `skins.js:139`) · a solo run leaves no skin key in the room's memory, so a solo then a room match can repeat a skin · `owned()` is never given grants — the first LOCKED skin would be owned by nobody (`view.js:965`, `victory.js:70`, `picker.js:81`) · `css/prism.css:832–833` names pixel + galaxy by hand (a third night page skin must be added there — not in the checklist).

**Checked and fine**
- **Rotation:** `k` is dealt once at the match's start (`prism/index.js:58–65`) and stored as `game.sk`; the director never touches it, so a replayed step, a host change, a refresh, a rejoin or a look flip all read the same `k`. Phones with different pools differ only in their own drawing.
- **Pins:** an un-owned, wrong-look, retired or garbage pin falls back to ROTATE (`poolOf` + the picker). Solo: +1 per start, never on a refresh; THE DROP keeps the day's skin across a refresh.
- **Assets:** network log per skin — each fetched only its own files; the preload graph 57 modules / 614 KB (budget 1.5 MB).
- **Tiers:** 3 → 1 → 0; the extras go first, the board's 3× last. Motion is transform / opacity; every new effect has a reduced path. No skin-specific branch in view / board / rail / victory.
- **The at-a-glance test** (the same board, 390, real size — I looked at both pictures): crayon = hatched wax with dark outlines · watercolor = soft washes, no outline · paper = flat squares on a white sheet on kraft; neon = outline tubes with dark centres · pixel = bevelled chunks, cyan frame · galaxy = filled glowing clouds on space. Told apart at once, pieces + ghost + incoming rows readable in each.
- **The settings DAY + NIGHT rows:** two rows of four 78 × 92 tiles, no overflow. **NO PILLS:** a DOM audit over 6 skins × 7 states found no new capsule (the SLAM gloss + the podium's button are older).

## 6. THE SHARE CARDS — checked and fine
- The order name → big time → stat line → art in every SHARE TODAY section and on THE PASSWORD's + COAST CLEAR's own cards; sizes equal across sections (name 36–39 px, time 79 px, stat 22–23 px); the name green made / red failed, THE DROP white, the time white, the stat grey, no win word; NO doors in SHARE TODAY, no beam wedge, THE DROP's strip = 8 rows; the foot = one straight line + plain lettering; every band but the lamps within 2.5 px of the centre line. share-same 39 / 39.
- **No spoiler:** THE PASSWORD draws colour tiles only; THE DROP's junk rows are solid on the server and again on the phone (all 14 rows × 10 cells the same grey in the pixels); the share text and file names carry no answer, seed or secret.
- THE PASSWORD's own card: each room one centred column, both from the same top, the pair centred, a 110-px gap, a failed room red, six rows fit.
- At a 360-px thumbnail the date, names, times and the address read well; the stat line is small but legible.

## 7. THE CITY TAP-GUARD (SKINS 2B, `097dcc34`)
On a phone held upright (390 / 430) the guard is right: nothing it should allow is blocked, nothing sticks. Wider than the phone it broke the city's edges — **C1**, in the must-fix list above.

**Checked and fine (driven on the title preview, Chromium, mouse + touch):**
- The city with no screen open: a billboard opens its card. The dock's buttons are inside the city's root with their own handlers — JOIN / BOARD / PLAY / YOU / HOST all arrive; ☰ and music are on `<body>` with their own.
- Closing a sheet, then the very next tap on a billboard: opens at once (also during the sheet's fade-out — a closing pop-up takes no pointer events).
- **No stuck state after a fast open / close:** 20× open + close by the backdrop, by Esc and by ×, and 20× click + Esc with no waits → the layer count is 0 after, the next billboard opens.
- A finger down before a screen opens and up after: no card. Down on a screen that closes before the up: no card. The next tap works. A cancelled touch and two fingers leave nothing stale.
- `e2e-daily`'s 62 checks pass (every SCORES card, the gaps, the padding, the results list — no city card ever opens under the DAILY screen).

**Findings**
- **C1 (MUST-FIX — the city, live now)** — see the top.
- **C2 (SHOULD-FIX) — a layer nobody gives back now kills the whole city until a reload.** Before the guard a leaked layer only kept the dock from resting; now `layersOpen() > 0` refuses every city tap (`title-taps.js:57, 89`) and nothing self-heals. Two real leaks: THE RADIO's `destroy()` removes the desk without its release (`js/screens/harbor/radio.js:590–596`; reached with the desk open by a 403 on refresh or the crew switch going off) — driven: layers stay 1, a billboard is dead (one Esc heals it; a phone has no Esc); and `?preview=card` drops its release (`js/progress/preview.js:94–96`) — Ben's own preview link, Esc does not heal it. Fix: release in both; and let `layersOpen()` drop an entry whose element is no longer in the page.
- **C3 (SHOULD-FIX — check on a real Android phone first; older than the guard):** a sheet opened from a pointer-up is closed by that same tap's click. In Chromium's touch emulation and Playwright's WebKit the game card and the dock's PLAY shelf open, the click lands on the new backdrop, and the sheet closes (`js/ui/sheet.js:44` has no "just born" guard; `vault/full.js:259–261` has one). A real iPhone sends no click to a plain canvas, which is why Ben never sees it. `e2e-daily.mjs:250` passes only because the card still exists during its fade-out. Fix: ignore backdrop clicks for the sheet's first ~350 ms.
- **NICE:** `window.__district.covered()` with no argument is always true (it defaults to the canvas on `<body>`), so `e2e-daily.mjs:230–232` cannot fail · docs/title.md + `layers.js:38–39` say rule (c) covers "an overlay still fading out" — it does not (and should not).

## 8. THE OLDER BUGS
**PRISM full's REFRESH check ("one clear = ONE attack" → `[4, 4]`) — CONFIRMED.**
- **Cause:** the attack's key is `{sender}-{piece}` but it lives under the TARGET (`view.js:596–611`: `prismq/{match}/{target}/{me}-{i}`), and the rule is create-only at that path only (`database.rules.json:870–875`). Nothing remembers who was hit: a reload re-picks the target (`logic.js:113`). When the replayed piece picks a DIFFERENT opponent, the same key is new there and lands again.
- **The suite:** `e2e-prism.mjs:167–175` forces the replay itself. FAST (2 phones) has one possible target — always green. The full run (8 phones) is red when someone else hit the player between the save and the replay: 3 red of the 12 saved full-run logs.
- **Real players:** only if the attack reached the server and the save of the same frame did not (a tab killed between two writes), then a refresh, then a different target. Rare; one clear's rows land on two opponents.
- **Fix — client only, no rules change:** every phone already mirrors the whole `prismq/{match}`. In `sendAttack`, before picking a target: if `{me}-{i}` exists under ANY target, send nothing. A pure helper in `logic.js` + a unit test; the E2E line then holds on every run. (A rule-side ledger is the only thing that stops a modified phone — ride it on the next rules pass.)

**The DISCONNECT check ("ALICE, gone > 30 s, is out") — NOT a product bug; a test assumption.**
- The check (`e2e-prism.mjs:770–791`) closes the host's page and expects an out entry with `gone`. In the 3 red logs the FAIL comes 0.0–0.1 s after the new host took over, 9–10 s after the kill — before 30 s could pass: the host had already topped out (a real KO has no `gone`). She is the fastest bot, so everyone's hit-back targets her. *(Inferred from the logs' timing + the director's code; not re-run.)*
- **Fix (test only):** keep the host's board alive until the kill, and check she is still in before asserting.

## 9. SOUND
**The previews' silence on Ben's iPhone — cause NOT found.** I could not reproduce it and can't run iOS here.
- **What works:** the preview runs the app's own unlock (`prism-preview.html:235` → `installAudio()`), forces mute + music-off OFF (`:236`), and shows TAP FOR SOUND on every phone. In Chromium — on `localhost` AND on a plain-http LAN-style origin (not a secure context, like `192.168.1.187`), mouse + touch, an iPhone user agent, the night and the day set — one tap gives a running context, a sounding song and the skin's file decoded. Nothing on the path needs HTTPS. Songs and sound files serve 200 / 206 from :5190.
- **The three candidates, most likely first — each a 10-second test for Ben:**
  1. **The ring / silent switch.** PRISM's songs and effects are Web Audio only (no `<audio>` path), and iOS mutes Web Audio in Silent Mode unless the page's audio-session type is applied. The live site and the LAN page differ in their headers, so the session type may differ too. *Test: flip Silent Mode off, tap TAP FOR SOUND again.*
  2. **A stale tab.** The preview fixes its song clock at page load (`prism-preview.html:108–116`); past the playlist's end (≈ 15 min battle, ≈ 2:45 rush) no song is left, and once the bots top out there are no effects either. Driven: the clock +16 min → a running context, no voice at all. *Test: reload, tap at once.*
  3. **Saved settings on the LAN address.** `:236` forces only mute + music-off; `sfxOff` and the two sliders persist per origin. *Test: ☰ → Settings on the preview.*
- **How to make previews audible for review (a suggestion — a tool change, small):** with `&sound=1` mount the engine's own readout (`js/audio/diag.js#mountAudioDiag`) and keep TAP FOR SOUND up until the context runs, its clock moves and a voice sounds — labelled with the reason otherwise. One screenshot from the phone then says which of the three it is. Also restart the preview's song clock at the tap (kills candidate 2).

**The pitched skin sounds vs the songs' key — yes, some clash.**
- The code-made sounds follow the song's key (`data/prism/<id>.json` → `tonic` + `mode` → `audio.js#setKey`). The SOURCED files are played as recorded, never transposed (`audio.js:339–347`); a lock gets a random ±3 % rate, a clear none.
- Estimated pitch (decoded in Chromium; spectral peaks + YIN; the files are 70–130 ms, so ±10 cents at best):

| file | what it is |
| --- | --- |
| pixel-lock | a clear **G5** |
| pixel-clear | a chromatic sweep G5 → E7 — an effect in any key |
| galaxy-lock | a clear **C7** (+ octaves) |
| galaxy-clear | a noise whoosh, then a quiet **C–E–G–B** shimmer |
| watercolor-lock | a drop chirp between C6 and C#6 — never clearly right or wrong |
| watercolor-clear · paper-lock · paper-clear | noise — fine on every song |

- **On the NIGHT set** (where the night skins normally play): pixel's G fits all five songs; galaxy's C fits four and **clashes on prism5 (D major — C natural under its C#)**.
- **On the DAY set** (a night skin on a day host's songs — the set follows the HOST's look, the skin each phone's own): pixel's G clashes on prismd1 (C# minor), prismd2 (E major), prismd3 (A major); galaxy's C clashes on the same three; both fit prismd5.
- **The ±3 % wander is ±51 cents:** a clearly pitched lock is more than 20 cents off its own note on about 60 % of plays — slightly sour even where the file fits.
- How much it matters: the locks sit about 16 dB under the song, so it is subtle; a 4-line clear reaches the song's level. The songs' keys are the build's own estimate (confidence 0.41–0.82). **Ben's ear decides.**
- **Fix (S13):** store each pitched file's root in the skin's `sounds` (pixel-lock G, galaxy-lock C, galaxy-clear C) and set the rate to the nearest tone in the song's scale (≤ 2 semitones); vary a lock among the tonic / 3rd / 5th instead of the random ±3 %. Leave the noise files alone.

---

## WHAT I CHECKED AND FOUND FINE (short)
- THE DROP's scoring, replay, floor, end, points, own-day rule, throwaway gate, seed handling — §1.
- THE SCHEDULED GO-LIVE and the page open across it — §2. The per-day SWEEP / PERFECT WEEK set, PENTHOUSE's close — §3.
- Solo pause, both modes, and the server's survival check — §4.
- TODAY with three tickets, both looks, two sizes — §3. The share cards' rule, colours, centring (but the lamps) and spoilers — §6.
- The rules these touch: `dly/` + `progress/dlive` have no rule (default deny — server only); `players/{uid}/dy` is a boolean the player owns.
- Suites as they are, on my own servers: unit (drop, judge, go-live, share, skins-2b, city-covered, solo-pause) 49 / 49 · `daily-drop.test` 11 / 11 · `e2e-drop` 34 / 34 · `e2e-playnow --only pause` 7 / 7 (WebKit) · share-same 39 / 39 · *(the rest: see THE SUITES)*.

## THE SUITES (run as they are, on this review's own emulators + servers; nothing changed)
| suite | result |
| --- | --- |
| unit — drop, drop-judge, go-live, drop-share, solo-pause, share-rhythm, city-covered, skins-2b | 49 / 49 |
| `daily-drop.test` (/api) · `daily-golive` + `daily-module.test` | 11 / 11 · 23 / 23 |
| `e2e-drop` (Chromium) | 34 / 34 |
| `e2e-daily` (the tap-guard's 62 checks, THE ROOM WINS on COAST CLEAR, THE SWEEP) | 62 / 62 |
| `e2e-playnow --only pause` (WebKit) | 7 / 7 |
| share-same · the share unit tests | 39 / 39 · 19 / 19 |
| `e2e-prism` FAST | 64 / 64 |
| `e2e-prism` full (8 phones), once | **91 / 92** — REFRESH + DISCONNECT both green this time; the red is **K6** below |
| the whole unit suite (before the push) | 1,895 / 1,895 |

**K6 (SHOULD-FIX, test only) — the full suite's NIGHT LOOK check is red two runs in three since the night rotation.** `e2e-prism.mjs:596` waits for the night FAMILY (`look === 'neon'` is true for pixel + galaxy too), then `:603` asserts the neon skin's light layer. The room's first counter is `hash(seed) % 60`; this run dealt 55 → ARCADE PIXEL → "0 light(s), 0×1". SKINS 2B's own full run was green by the one-in-three. Fix: pin NEON on that phone for the check (and add one line for a page skin: no light layer, its own clear).

---

## THE FIX PASS — ready to paste (about 3 h in all; A alone is enough to go live)

**GROUP A — THE DROP: no honest run lost (M1, M2, M3 + S1, S2) — ~1.5 h**
1. `drop-judge.js#act`: a `ppause` / `pause` whose chunk is out of step still pauses (answer `resync: true` + the pause's clock). A `ppause` that would end the run `late` while a pause is left = a backdated pause (the refresh's rule), one of the 3.
2. The chunk store: read the record first; store only for a run in flight, `at ≤ record.len ≤ LOG_MAX`; key `${at}_${length}` so a shorter chunk never replaces a longer one; `joinChunks` reads both key forms. A chunk from a profile with no run is never stored.
3. `drop/view.js`: `pause()` and the hide wait for the upload in flight; `null` / no `pa` is never "paused"; `stop()` sends no checkpoint right after a room pause.
4. Tests: unit (`prism-drop-judge`: pause + resync, the late ppause, the join with two chunks at one offset) · `daily-drop.test` (a shorter chunk after a longer one → the finish still scores; a chunk with no run → nothing stored; the lost hide) · `e2e-drop` (`send(); pause()` → the server paused; `send(); hide` → paused, 27 s away, the run goes on).

**GROUP B — THE DROP: the edges (S3, S4, S5, S6, N4) — ~1 h**
1. A refused finish: scored at the last provable point, marked, reported; the ticket says so.
2. `view.js#took`: `off = max(off, new)`. 3. The finish retries on `online` / on show. 4. `engine.js#gravityMs`: the 12-number table (node's values; a unit test pins the bits). 5. `progress.js#dayCounters`: never delete the run's own day.

**GROUP C — THE SHARE CARDS (S7, S8, S10 + Ben's calls S9, N6) — ~45 min**
1. COAST CLEAR's lamps: centred on the ink, capped by the column; re-take the frozen copies. 2. THE PASSWORD's day doors. 3. Letter-spacing by hand where the canvas has none. 4. Only if Ben says so: THE DROP's own card on the one rule; the grids bottom-aligned.

**GROUP D — PRISM's old red (S12) — ~20 min**
1. `sendAttack`: skip a piece already in the queue mirror under any target (pure helper + unit test). 2. `e2e-prism`: the host kept alive until the DISCONNECT kill.

**GROUP E — THE CITY TAP-GUARD (C1, C2, C3) — the city chat, ~40 min; C1 is live now**
1. `title-taps.js#covered`: the root's ancestors + the scene's wrap count as the city; a 1440 × 900 and a sideways (844 × 390) tap case in the suite. 2. THE RADIO's `destroy()` and `?preview=card` give their layer back; `layersOpen()` drops an entry whose element left the page. 3. After a real Android check: the sheet ignores backdrop clicks for its first ~350 ms.

**GROUP F — SKINS + SOUND (K1–K6, S13) — ~1 h**
1. The kick + the pulse no longer fight (K1). 2. The preview's forced clear = a real clear; the perf tool's heavy set fires real clears; re-measure galaxy + neon (K2, K3). 3. The settings tiles one a frame (K4); ARCADE PIXEL's lettering at 8 px + a pixel arrow (K5). 4. `e2e-prism`'s NIGHT LOOK check pins NEON (K6). 5. The pitched files keyed to the song (S13); the preview's sound readout + its song clock restarted at the tap.

**After Ben's iPhone check:** S11 (the share sheet after the waits) — build the card before the tap, if it fails there.

---

## FOR BEN's PHONE (the Beelink's :5190)
- The lamps out of the column (S7): http://192.168.1.187:5190/tests/integration/daily-preview.html?view=share&state=swept&look=night
- THE PASSWORD's black door by day (S8): http://192.168.1.187:5190/tests/integration/daily-preview.html?view=share&state=one&pw=front&look=day
- THE DROP's own card — on the rule or not? (S9): http://192.168.1.187:5190/tests/integration/daily-preview.html?view=share&state=waiting&drop=1&dropst=done&look=night
- SHARE TODAY with 3, the reference (and N6's top-aligned grids): http://192.168.1.187:5190/tests/integration/daily-preview.html?view=share&state=swept&drop=1&look=night
- The REAL share tap — does the sheet open? (S11; Safari AND the home-screen app): http://192.168.1.187:5190/tests/integration/daily-preview.html?state=swept&drop=1
- Sound — Silent Mode off, reload, tap TAP FOR SOUND at once (§9): http://192.168.1.187:5190/tests/integration/prism-preview.html?skin=galaxy&n=5&stack=10&bot=1&sound=1 · pixel: http://192.168.1.187:5190/tests/integration/prism-preview.html?skin=pixel&n=5&stack=10&bot=1&sound=1
- The city's dead edges (C1) — turn the phone SIDEWAYS and tap the door at the far left: http://192.168.1.187:5190/tests/integration/title-preview.html
- By ear, in the real game: a DROP run → lock the phone → come back (no hum, no pop — §3); galaxy's chime on a D-major night song (§9).
