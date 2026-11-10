# PFIX-A — PRISM DROP: THE PLAY-BREAKING FIXES (Nov 10 2026)

FABLE REVIEW #1 of PRISM DROP (docs/games/review-prism-1.md) → its MUST FIX 1–5, question D, the night gain and OPTIONAL 18; Ben: "take the
recommendations" (the decisions: docs/games/plan.md "PFIX-A"). **No rules change** (database.rules.json untouched — finding 5's per-piece key
works under the CURRENT rules: `prismq/…/$key` is any key, create-only). MUST FIX 6–7 (the rules) + SHOULD FIX 8–10 are PFIX-B's. Still 8
functions. Never the live site: the emulators + local servers only. Never the three words. Each fix: its pin written first (red), then the fix.

## Step 0
e4b057b3 — docs/games/plan.md "PFIX-A — THE PLAY-BREAKING FIXES", appended unchanged.

## Group 1 — THE LOCK (finding 1 + question A)
- **Pin first** (`tests/prism-engine.test.mjs`): the review's matrix — levels 1, 3, 5, 8, 10, 12, 15, 20 × a turn every 100 / 150 / 250 / 400 ms ×
  CW/CCW alternating + CW only × the I, T, S, J pieces + the long piece over a 4-wide pit = 320 cases, 3 rows queued: every piece must lock within
  `LOCK_MS × (MAX_RESETS + 2)` = 8.5 s of first touching down + the queued rows land. **Red: 258 of 320 never locked.**
- **Fix** (`engine.js`): once the piece has touched down on its lowest row (`touched`), EVERY move / turn spends a reset — grounded or kicked off
  the floor; with the resets spent, in the air the lock delay is used up (`lockT = LOCK_MS`) → it locks on the tick it touches down again
  (question A: "at once"). The matrix then found a SECOND cause: `noteLowest` compared the box's ORIGIN, which a rotation moves while the piece
  goes no lower — the long piece "descended" on every turn and got its 15 resets back. Now the lowest CELL (`bottom()`). **Green: all 320, the
  slowest 7.1 s (the long piece, level 3, a turn every 400 ms alternating).** + "the next touch-down locks at once" (the resets spent, lifted a row).

## Group 2 — AWAY (finding 2 + question E)
- **Pin first:** the director simulation (`tests/prism.test.mjs`) — ONLINE, silent 31 s → out, `away`, no credit, the hidden phone never the winner;
  29.999 s → still in; a board never written counts from GO; the review's 340-s probe → out after 30 s.
- **Fix** (`director.js`): a board whose `at` is ≥ `OFFLINE_OUT_MS` stale during play is out (`gone` + `away`), credited to nobody, whatever presence
  says (gone — presence — is checked first). The heartbeat = the view's save (written every ≤ 3 s while its frames run — already true, now named);
  the view saves at once on `visibilitychange → hidden` + `pagehide`; a board the director put out stops (`eng.over`); the KO card says AWAY,
  everyone else "X — AWAY". The old whole-match simulations stamp their boards' `at` (as the view does) — they were silent boards before.
- **e2e** (`e2e-prism.mjs` `awayCheck`, both paths): a second tab brought to the front hides BOB 36 s — presence online the whole time — out after
  30 s, `{ away, gone, by: null, place: 2 }`, the KO card "KO · AWAY · 2ND PLACE", ALICE wins. Two traps on the way: (1) in FAST the other phone
  could top out under the rows already coming while BOB was away (its board is cleared first, as the host-kill step does); (2) back on screen the
  phone's sound is suspended by the site's fade on leaving (THE FADE ON LEAVING) — the step taps once, as a person picking the phone up would.

## Group 3 — THE TEARDOWN (finding 3 + optional 18)
- **Pin first** (`tests/integration/e2e-prism-leak.mjs` — new): two phones, BATTLE then REMATCH × 6 (the review's probe), the host's phone at
  390 × 844 @2, at each podium after two forced collections. **Red on the OLD code (js/ stashed, the same test):**

  | after match | 1 | 2 | 3 | 4 | back in the room |
  | --- | --- | --- | --- | --- | --- |
  | live canvas pixels, MB | 34.3 | 50.1 | 67.7 | 83.4 | 134.7 |
  | DOM nodes | 2 993 | 3 329 | 3 674 | 3 998 | 4 607 |
  | listeners | 192 | 210 | 226 | 243 | 301 |
  | convolvers made | 2 | 3 | 4 | 5 | 5 |

  no old match root ever collected.
- **Fix:** (a) `js/ui/fit.js` (the console's — the smallest change): the late-font list holds WeakRefs; a fit lives as long as its element (the
  `fits` WeakMap + a new `anchors` WeakMap — `vault/full.js` anchors its own late-font fit to its line); a connected element still re-fits on a late
  font. (b) PRISM's `unmount()` destroys everything `mount()` made: `board.destroy()` (its canvas + both offscreens — `size()` also zeroes the old
  pair on a resize), `fx.destroy()`, `nfx.destroy()`, the callouts, `synth.destroy()` (the clock that held the view), the root's ResizeObserver,
  the hide / pagehide listeners, the tip; every canvas under the root → 0 × 0; an `update()` / announcement after the unmount does nothing.
  (c) OPTIONAL 18: ONE reverb a page — `audio.js#chainFor`: the synth's bus + dry + convolver (+ its ~1 MB impulse) belong to the AudioContext.
- **The probe's own trap:** after the fix the roots STILL lived — the retainer finder (`RETAINERS=1`: a heap snapshot through CDP, the root tagged
  with a named object, the shortest strong path from the GC roots) showed `(Global handles) → DevTools console → .final-body.pd-fs → … → .pd`: the
  test's own `waitForSelector('.final .pd-fs')` returned an ElementHandle that was never disposed. The test never keeps a handle now
  (`waitForFunction` + dispose). The review's own probe found the fit.js retainer through a `FontFaceSet` listener path — both were real.
- **Green — 30 rematches (the long log):**

  | after match | 1 | 2 | 5 | 10 | 20 | 30 | back in the room |
  | --- | --- | --- | --- | --- | --- | --- | --- |
  | live canvas pixels, MB | 34.3 | 36.1 | 36.2 | 36.2 | 36.5 | 36.5 | 71.9 (the city on top) |
  | DOM nodes | 2 996 | 3 009 | 3 022 | 3 027 | 3 049 | 3 054 | 3 331 |
  | listeners | 194 | 194 | 194 | 194 | 194 | 194 | 235 |
  | JS heap, MB | 34 | 35.8 | 39 | 42 | 43.2 | 44.7 | 45.8 |
  | convolvers made | 2 | 2 | 2 | 2 | 2 | 2 | 2 |

  match roots 1–28 collected (29 on its way out, 30 on screen). (The two convolvers = the city's own + PRISM's one.) **For FR7:** the JS heap still
  creeps ~0.35 MB a match (34 → 44.7 MB in 30) with no DOM / canvas / listener growth behind it — likely the room's growing state (`night/{matchId}`
  rows, the SDK's cache of past match nodes); not PRISM's screen.
- **OVERCLOCK (for FR7 — the same probe, `GAME=overclock MATCHES=3`, report only):** the console's `fit.js` already fixed, three QUICK matches played by their own timers
  (~5 min each), at each podium:

  | after match | 1 | 2 | 3 | back in the room |
  | --- | --- | --- | --- | --- |
  | live canvas pixels, MB | 4.8 | 4.9 | 5.4 | 60.3 |
  | DOM nodes | 2 718 | 3 284 | 3 123 | 3 703 |
  | listeners | 153 | 157 | 162 | 228 |
  | JS heap, MB | 34.7 | 36.5 | 38.2 | 40.9 |

  No screen-sized leak left in OVERCLOCK (its canvas memory is small and flat; the nodes go up and down). Two small slopes for FR7: **+4.5
  listeners a match** and the heap +1.7 MB a match — OVERCLOCK's `unmount()` (`overclock/view.js`) has no ResizeObserver / document listener
  sweep like PRISM's now does; a 10-match run would tell. Whether OVERCLOCK leaked through `fit.js` BEFORE the fix wasn't measured on the old
  code (its podium uses the same `ui/final.js` names, so it did keep each podium's tree the same way).

## Group 4 — THE DOUBLE KO (finding 4 + question B)
- **Pin first** (`tests/prism.test.mjs`): 2 and 8 players, the last two out between two steps (60 000 vs 60 040 ms) → **red: `winner: null`**.
- **Fix** (`director.js#outOrder`): the boards out in one tick in the order of their server stamp `at`; an exact tie → fewer rows SENT first, then the
  LATER joiner (`players/{uid}/joinedAt` — `index.js#step` passes `state.players`), then the uid; when they are the last ones, the one out LAST wins
  (no out entry — place 1; its own top-out is no KO). Green: the later one wins, exactly one first place, the knocked-out callers judged on it, the
  tie rules both ways, the same patch twice. On the winner's phone the KO card clears for the VICTORY.

## Group 5 — A REFRESH NEVER ATTACKS TWICE (finding 5)
- **Fix (no rules change):** the attack is saved in the SAME FRAME it is sent (`sendAttack` sets `pubForce` → the frame's `publish` writes `sv`), and
  the board is saved on hidden / pagehide — a refresh comes back AFTER the clear. The attack's key = the sender + the piece that made it
  (`prismq/{m}/{target}/{uid}-{n}` — the engine's `send` event carries `i`, its piece index; the rules' `$key` is create-only, so a replayed piece
  is refused); the receiver takes attacks in the order of their SERVER stamps (the new keys don't sort by time) and a restored board skips every
  attack stamped ≤ its save's mark (`sv.ak = '@<ms>'` — was the last push key). Each pending row keeps its rise (`pd` + [ms still to wait, ms
  risen]; a save from before PFIX-A: due at once, as before). The rest of finding 7 (the server's `now`, one attack per piece IN THE RULES, the
  target not out, `sv` closed) needs the rules → PFIX-B.
- **Pin** (`e2e-prism.mjs` `refreshAttackCheck`, both paths): a scripted 4-line clear, the page reloaded 400 ms later → the board comes back after
  the clear (piece n → n + 1, 4 lines); the same piece's clear replayed → refused by its key; the queues hold ONE [4] from it; the reloaded
  phone's pending ≤ what was sent to it in the last moments (the receiving side — a regression of my own caught here: a heredoc ate the `\d` of
  the mark's pattern, so a refreshed board took every old attack again; fixed before any commit, the check stays).

## Group 6 — AUTO-TARGET FORGETS (question D)
- `logic.js#TARGET_MEMORY_MS` = 20 s; `attackersOf(hits, now)` = only who hit you in the last 20 s; `autoTarget({ …, currentHit })` — a target picked
  BECAUSE they hit you goes back to THE RANDOM PICK once forgotten (a random pick is kept while valid — forgetting alone changed nothing: the kept
  `current` was the old attacker). The view + the whole-match sim use it.
- **The spread** (the review's probe as a test — 8 equal players, 400 attacks ≈ one a second across the room, 1–4 rows, 40 seeds): the biggest
  share of an even split **1.89 on average, worst 4.28 → 1.37, worst 1.77**. Feuds that keep hitting each other inside 20 s still trade — the rule's
  nature (worth a word to Ben if a room still feels lopsided).

## Group 7 — THE NIGHT GAIN
- Measured from the files (`python scripts/build-prism.py --night-gain` — ffmpeg's ebur128, as the day set's build measures): **prism1 −8.7 LUFS
  (peak +2.6 dBTP) → −5.7 dB · prism2 −12.5 (+0.4) → −1.9 dB · prism3 −15.0 (−1.7) → 0 dB (0.6 LU under the day set: a cut only, never a boost) ·
  prism4 −8.9 (+1.8) → −5.5 dB · prism5 −7.6 (+4.7) → −6.8 dB**; the day set −14.4. Stored in each song's JSON (`lufs` / `tp` / `gain`) + the
  manifest's `gain`; a new or re-encoded night song is measured on its build. The files untouched.
- Played PER VOICE (`audio/synced-songs.js` `levelOf` — a gain node after the voice's envelope: a crossfade keeps each song's own level, every
  envelope reading — the heard voice, the e2e's `gain` — unchanged; `relevel()` for a manifest that arrives after a voice started). The listener
  (the kick detector) is level-relative (mean + spread), so the cut changes nothing it does. Every other player passes no `levelOf` = unchanged.

## Group 8 — SPEED, LIKE FOR LIKE
The PD-3 / PD-4 check like for like — `prism-shots.mjs` PERF, `GPU=1` (the Radeon, `gpu-check.mjs` first: WebGL2 on D3D11), 4× CPU,
390 × 844 @3, 7 rail tiles, the bot, each tier LOCKED, ~300 frames (a plain `serve.mjs` — the preview's `networkidle0` never settles on `--emu`):

| | tier 3 | tier 2 | tier 1 | tier 0 |
| --- | --- | --- | --- | --- |
| NIGHT rest — CPU p75 / p95 (PD-3) | 3.1 / 3.8 (3.5 / 4.2) | 2.8 / 4.1 (3.5 / 4.0) | 2.5 / 3.8 (2.6 / 3.6) | 2.6 / 3.5 (2.7 / 4.0) |
| NIGHT heavy (PD-3) | 5.3 / 7.0 (5.7 / 6.6) | 5.4 / 6.9 (5.3 / 6.2) | 4.6 / 6.2 (4.8 / 5.7) | 3.8 / 5.0 (4.0 / 4.7) |
| DAY rest (PD-4) | 2.1 / 2.9 (2.0 / 2.8) | 2.0 / 2.9 (2.0 / 2.8) | 2.0 / 2.7 (2.1 / 2.8) | 1.8 / 2.6 (2.0 / 2.7) |
| DAY heavy (PD-4) | 5.3 / 6.3 (4.8 / 6.0) | 4.9 / 5.6 (4.3 / 5.4) | 4.2 / 5.2 (3.7 / 4.9) | 2.9 / 3.8 (3.0 / 3.8) |

**60 fps at every tier in both looks, frame p95 16.8 ms — as in PD-3 / PD-4.** The day's heavy CPU read ~0.5 ms over PD-4's log, so it was
settled LIKE FOR LIKE — an A-B-B-A against the code before this pass (`e4b057b3` in a worktree on :5175) in the same minutes, the heavy moment,
tiers 3 / 2 / 1, CPU p75: DAY before 5.3 · 5.2 / 4.8 · 4.8 / 4.1 · 3.9 vs after 5.4 · 5.1 / 4.9 · 4.9 / 4.0 · 4.1; NIGHT before 5.6 · 5.6 /
5.4 · 5.4 / 4.7 · 4.6 vs after 5.7 · 5.5 / 5.5 · 5.4 / 4.6 · 4.5 — **the same** (PD-4's numbers were a quieter day of the machine). No slower.

## Tests
All local, on this pass's own fresh servers (the emulators + `serve.mjs --emu`; plain servers on :5174 / :5175 for the speed A/B):
- `node --test tests/*.test.mjs` **1500 / 1500** (the PRISM files 90: + the lock matrix, the next touch-down, AWAY, the double KO, the forget rule,
  the spread; the whole-match sims stamp their boards).
- `FAST=1 e2e-prism.mjs` **59 / 59** (+ REFRESH × 3, AWAY × 2; the receiving-side check proven RED with the mark's bug put back: "pending 4 ≤ 0").
- The FULL 8-phone `e2e-prism.mjs` **86 / 86** (was 81 — REFRESH × 3 + AWAY × 2; the AWAY hide runs inside the host-kill's 30 s, so the bots get
  no extra time to knock the room out — a first try that hid HAL after it left CHARLIE out of the duel).
- `e2e-prism-leak.mjs` **6 / 6** (6 rematches) + the 30-rematch log (6 / 6) + OVERCLOCK's 3 (report only).
- The harbor groups that use `fit.js`: `ONLY=platefit,cardfit,stripfit,vault,youcard,fullcard,playercard` **99 / 99**.
- `e2e-profiles.mjs` **139 / 139** (run first on the fresh emulators), the smoke test **6 / 6** (both playable games), `rules.test.mjs` **69 / 69**,
  `server.test.mjs` **44 / 44**.
- The preload graph regenerated (`node scripts/build-preload-graph.mjs` — prism 43 modules, 408 KB); THE BOOT PRELOAD current.
- Every server this pass started was stopped at its end (the emulators' Java + node, serve.mjs :5173 / :5174 / :5175, the worktree removed); Ben's
  :5190 preview server untouched.
