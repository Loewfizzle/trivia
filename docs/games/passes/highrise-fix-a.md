# HIGH RISE — REVIEW FIX A: THE MATCH (Nov 20 2026)

**No rules change** (`database.rules.json` untouched — nothing to re-publish; `jw` + `hr` not touched). The `hr` rules ARE published
(Ben re-published S4B's file on Nov 20 — it equals `database.rules.json`): the repo's record updated (`tests/fixtures/rules-live.json`
= the rules, the ack deleted — the review's MUST 1). HIGH RISE stays HIDDEN (the owner's phone only) and NOTHING COUNTS
(`HIGHRISE_COUNTS` off). The owner's calls: `docs/games/plan.md` "HIGH RISE — REVIEW FIX A". The findings this pass built from:
`docs/games/passes/highrise-review.md`. The bible: `docs/highrise.md` "THE MATCH" (REVIEW FIX A).

| commit | what |
| --- | --- |
| `807acd2d` | Step 0 — Ben's calls on the review into plan.md; the live-rules record updated (the `hr` rules are published) |
| `b18dfce8` | Group 1 — THE TOP HUD + THE WATCH LIST + the place ties |
| `29858e81` | Group 2 — SPECTATE IN SYNC (+ the new test `highrise-spectate.mjs`) |
| `192bec33` | Group 3 — THE MATCH FIXES (MUST 3 · SHOULD 1 · SHOULD 5 · SHOULD 4 + 10 · the match E2E at any hour) |
| `4b1fbda2` | the close — THE FRESH-EYES REVIEW's fixes (+ the short phone's place number) |
| the close (top) | the docs, the pass log, the final run (the ci tag) |

THE ADD-ON INBOX: read at the start, after every group's commit and before the final run — nothing was addressed to this pass. The
entries that arrived (Nov 20 8:55 · 9:10 · 9:15 · 9:28 am) are to THE NEXT CITY PASS — left untouched.

## GROUP 1 — THE TOP HUD + THE WATCH LIST (Ben's change 1 + the review's SHOULD 2) + the ties (Ben's call 1)
- **THE TOP HUD** (a match only — solo's approved stack is unchanged): the floor big + centred; the band + the clock ONE narrow centred
  line under it (`THE ROOFTOPS · 5:33` — 157 px, `.hi-bandrow`, letter-spacing 0.11 em); **THE PLACE NUMBER alone in the TOP-RIGHT
  corner** under the music button (from y 60): `8TH` 50 px, `/ 8` 17 px UNDER it, right-aligned; 1ST gold, the pulse kept (its glow
  copy now anchored right). The callouts under all of it: the call lane 30 px under the band line (so even a wide call clears the place
  number's foot by ≥ 16 px), the announcer 16 px under the call lane.
- **Measured at 390 × 844, day + night**, at 1ST / 4TH / 8TH with a `PERFECT ×5` AND `CHRISTOPHER PASSED YOU` up at once
  (`highrise-place.mjs`): floor → band line **16** · band line → callout **30** · callout → announcer **16** px (the review: 6 · 0 · 12 · 4);
  the place number ≥ 16 px clear of the floor (36–51), the band line (18–27), the callout, the announcer and every tag (156); the tags
  start under the HUD's foot. 1440 × 900: clear too. The 8-player pixel test: 0 rival pixels in the play zone, both looks (10/10).
- **THE TIES (Ben's call 1)**: `rivals.js#placeOf(rows, floor, perfects)` — ahead of you = a higher floor, or the same floor with MORE
  perfects; the same floor + perfects share the place. The WATCH list's numbers by the same rule (seven level bots on 9 · 9 · 7 · 5 …
  perfects read 1 · 1 · 3 · 4 …, no longer all "1").
- **WATCH's LIST** (SHOULD 2): at most `matchhud.js#LIST_MAX` = 5 rows — the leaders + the one you watch + YOU, the rest folded into a
  quiet `+N MORE` foot (a tap off the list still steps through everyone). It ends at 299 — THE DROP ZONE starts at 324–349 (8 rows of
  44 pt ran to 408, over a left-entering slab in 83 % of its frames).
- Shots: `Downloads\NEON\highrise-fix-a\hud\` — `place-<look>-390x844-start · first · mid · last · pulse-up · pulse-down`,
  `hud-<look>-390x844-<place>-calls` (a callout + an announcement), `watch-<look>-390x844-list · picked`, `hud-night-1440x900`. In the
  cartridge (the console's corner buttons): `Downloads\NEON\highrise-fix-a\e2e-match\match-rivals.png` · `match-watch.png`.

## GROUP 2 — SPECTATE IN SYNC (Ben's change 2: "it goes past, and then it snaps back on top and drops")
- **The cause** (the review): the watcher drew the watched slab on its OWN clock; their tap arrived 0.17–0.27 s later (the bots; a real
  match ~0.25–0.5 s) — by then the slab had slid 27–47 px past the tap, then jumped back and dropped.
- **THE PLAYBACK** (`stage.js`): the watched tower is drawn at THE PLAYBACK TICK = the match's tick − the delay; each landed tap is
  applied when the playback reaches ITS OWN tick (`feedWatch`), their end too — so the slab slides and drops exactly where they tapped;
  cuts, misses, grow-backs, falls are the engine's own, at their own ticks.
- **THE DELAY — 750 ms** (`WATCH_DELAY_MS`; my call: ~3 × the bots' worst, 1.5 × a real match's): every tap's lateness is measured as it
  arrives; one later than the delay GROWS it to its lateness + 300 ms (≤ 2.5 s), **eased in** — the playback runs at 0.7 × real time
  until it is there, never a jump. Until a tap lands the slab is HELD at its sweep's edge (never stepped to its fuse).
- **A CLEAN START**: a switch / a row's tap catches the new player's tower up to the playback tick and feeds it to the tower BEFORE the
  view adopts it — the catch-up's falling pieces, rings and last-landing bump are cleared (no half-drawn slab).
- The watcher's line + the ranked list read the DRAWN (delayed) tower's floor (`hook.watchFloor`); the test page's end card waits
  for the playback to show the last bot's end.
- **NEW TEST** `tests/integration/highrise-spectate.mjs` (32 checks): every watched frame recorded (the drawn tick, the slab's offset, its
  screen centre, px per unit); for each landing the slab's spot AT ITS TAP comes from the engine (the bot's own taps). ALEX, 20 landings
  by night + 20 by day: **drawn past the tap spot: max 0.00 px** (target ≤ 1), no tap after the playback had passed it, never past the
  sweep's edge, the delay 750 ms. **THE CONTROL** (the delay pinned to 0 = the old live clock) sees the bug: past the tap on 5 of 5
  landings, up to 42.9 px. A switch to another bot starts clean (the playback never runs backwards).

## GROUP 3 — THE MATCH FIXES
- **Ben's call 1 (the ties)**: Group 1.
- **MUST 3 — A GO IS NOT A PLAY**: the server counts a HIGH RISE match player only with a LANDED slab (floor ≥ 1) in its OWN replay —
  `api/_lib/highrise.js#hrPlayed`, applied in `api/report.js` to HIGH RISE's proof tree before the count (both report paths). 7 GO-only
  seats beside one player → 1 real player (the solo rule), never an "8-player match". JAYWALK's rule ("a silent player included") is
  untouched — THE PROOF PASS (Ben's call 3).
- **SHOULD 1 — A HOST HICCUP AT GO**: THE NODES ARE THE TRUTH here too — a FIRST GO the server stamped BEFORE the host gave up
  (`match.js#goBeforeGiveUp`) keeps every phone on the GO's seed (`startOf`, unproven mark or not) and the director takes the mark back
  (`unproven: null` + the GO's seed + tick 0) — the match is scored and counted as normal. A GO stamped after the give-up never moves an
  unproven match already climbing on its stand-in. (JAYWALK's director has the same step — not touched: the inbox, JAYWALK's next pass.)
- **SHOULD 5 — no GHOST all match**: the rivals' names + colours (+ the count's roster) are read again whenever the room's player list
  changes (a new object at every change — nothing per pump otherwise).
- **SHOULD 4 + SHOULD 10 — YOUR BEST (Ben's call 2: a COUNTED run raises it, solo or match, like JAYWALK; a run that never counted never
  sets it)**: the cartridge reads the SERVER's best only (`view.js` best `runs: false` — never the test page's `hi:play:best`, never an
  UNPROVEN run's own card, nothing while counting is OFF); the stage never raises it from a run of its own there. NEW BEST only of a
  best that was beaten (a first counted run = `YOUR BEST · n`), the match podium the same. The docs + comments say so (the server
  already wrote a match's floor to TALLEST TOWER). The test page keeps its own phone best.
- **The match E2E's daytime red**: ALEX is pinned to NIGHT before CHARLIE switches to DAY — it passes at any hour (run at ~10 am: 55/55).

## THE CLOSE — THE FRESH-EYES REVIEW (a separate read-only agent that wrote none of it) — its finds, fixed
1. **A late joiner's first watch skipped the clean start** — `watch()` read the frame's tick before any frame had run with the new
   clock (a spectator's `spectate()` + `watch()` come in one pump): the catch-up fed nothing, the next frame played every tap at once.
   → `watch()` works the tick out from the clock.
2. **The delay only grew — a hidden tab pushed it to its 2.5 s cap for good** (the pump kept collecting taps; back on screen every one
   read as seconds late). → taps that piled up while hidden / under a sheet are not measured; the delay comes back DOWN once the line is
   good (eased, 1.3 × playback — never a jump); `restart()` starts the playback's numbers afresh.
3. **SHOULD 1's take-back: a run that ENDED while the match was marked unproven never wrote its `e`** (`over()` needs `proven`) — no Call
   the Winner, the match waited 18 s. → once proven again, the pump sends the end (`view.js`).
4. **The short phone**: the match's call margin beats the 740 px step — now MEASURED at 375 × 667 too (`highrise-place.mjs`: the gaps
   ≥ 16 px, the announcer above THE DROP ZONE).
5. MUST 3 refuses a reporter who never landed a slab (also on the WOULD COUNT path) — by design; named under the calls.
6. Small: the place pulse's keyframes are now made once (a match's own code 11.1 KB/s with ties moving the place more often — the line is
   12); the watched list's strings while WATCHING (not in play) and the in-run NEW BEST moment on an unproven solo run (it crosses the
   server's best; the end card no longer says NEW BEST) are left as they are; the sweep-edge hold `s0 + 2S − 1` is classic's fuse (2
   sweeps) — a rule set with another fuse must move it (THE RULE-SET TABLE has one row today).

## THE FINAL RUN (this pass's own emulators + its own `serve.mjs --emu`, nothing else running; logs: `Downloads\NEON\highrise-fix-a\logs\`)
- Unit **2378 / 2378** · the rules **89 / 89** · `/api` **68 / 68** (run last, after the browser E2Es) · the smoke test **26 / 26**.
- `e2e-highrise` **85 / 85** (incl. the counting-ON run: a first counted run reads `YOUR BEST · n`; counting OFF: no YOUR BEST line) ·
  `e2e-highrise-match` (3 phones + a late joiner) **55 / 55** (at ~10 am — the look check passes by day now).
- The test page `highrise-play.mjs` **237 / 237** (REPLAY = LIVE ✓ on every run, a lost context survived) · `--webkit` **6 / 6**.
- Zero garbage: solo **5.9 KB/s** night + day (≤ 12) · a match with 7 bots **8.9 KB/s** (it read 11.1 before the pulse's keyframes were
  made once; the review measured 10.6).
- THE 8-PLAYER PIXEL TEST **10 / 10** (0 rival pixels in the play zone, both looks) · THE TOP HUD + the ties + WATCH's list
  (`highrise-place.mjs`) **150 / 150** (390 × 844 both looks, 375 × 667, 1440 × 900) · SPECTATE IN SYNC (`highrise-spectate.mjs`)
  **32 / 32** — 0.00 px past a tap on 20 + 20 landings; the control 5 / 5 landings past, up to 44.7 px.
- The 375 × 667 check (added for the review's find 4) caught a real overlap — THE PLACE NUMBER 10 px from the band line on a short phone:
  the place number steps down a size there (40 px; the 740 px step), now 25 px clear.
- Not run: the harbor suite (nothing in the city changed — the cloud runs it on the tagged push).
- Every server this pass started (the emulators, `serve.mjs --emu`) stopped at the end, by exact PID.

## THE CALLS MADE
- The lab export at the start was skipped: this pass changes no card art (as THE REVIEW).
- Solo's top HUD is unchanged — the owner's notes were about the match's cluster.
- The band + the clock on ONE line (the review's layout) rather than two narrow lines: it saves a row and keeps every gap ≥ 16 px.
- WATCH's list folds to 5 rows (the review's second option) rather than 36 px rows (a row under 44 pt breaks the touch-target rule).
- The delay 750 ms + its growth (above). A tap that arrives later than the delay after its slab already slid past cannot be un-drawn:
  with the delay this needs a > 0.75 s line; it is counted (`watchSync().past`) and the delay grows so the next ones are on time.
- MUST 3's "landed tap" = floor ≥ 1 in the server's replay: a real player who misses the very first slab is not counted as a player
  (they scored nothing; they lose the match-played XP).
- While counting is OFF the cartridge's end screen shows NO YOUR BEST line (the strict reading of "runs that never counted never set it").

## OPEN FOR BEN
1. **RE-PUBLISH: nothing** (no rules change). Nothing counts (`HIGHRISE_COUNTS` off).
2. **Your phone checks** (after the deploy):
   - THE TOP HUD + THE PLACE NUMBER + WATCH + SPECTATE IN SYNC — climb a little, let a slab drop (you are OUT → WATCH), tap a name,
     watch a few slabs land (they should slide and drop right where the bot tapped, no snap back):
     https://neonspeakeasy.com/highrise-play?mode=match&rivals=7 (by day: https://neonspeakeasy.com/highrise-play?mode=match&rivals=7&look=day)
   - A real 2-phone match from the hidden cartridge (you host, HIGH RISE · TEST from your room's list): https://neonspeakeasy.com
3. **Calls you can overrule:**
   - The band + the clock on ONE line (`THE ROOFTOPS · 5:37`); the call lane 30 px under it so a wide callout clears the place number.
   - THE PLACE NUMBER top-right under the music button: `8TH` 50 px, `/ 8` 17 px under it (40 px on a short phone).
   - Solo's top HUD is unchanged.
   - WATCH's list = 5 rows (the leaders + the one you watch + YOU, `+N MORE`) — tapping off the list still steps through everyone.
   - The spectate delay 750 ms (grows on a bad line up to 2.5 s, eased; comes back down) — the watched tower + its floor in the list +
     the WATCHING line run that far behind the live match; the other rivals' tags are live.
   - MUST 3's "a player" = at least one LANDED slab: a real player who misses the very first slab isn't counted (no match-played XP).
   - While counting is OFF the cartridge's end screen shows NO YOUR BEST line; a first counted run says `YOUR BEST · n`, NEW BEST only
     when a best is beaten — on the podium too.
   - The in-run NEW BEST moment (crossing the gold tape = the server's best) still plays on an unproven solo run.
4. **Not done here (named):** REVIEW FIX B (the share card — B · THE POSTER) · THE PROOF PASS (MUST 2 — your call 3: after go-live,
   before strangers) · JAYWALK's director has the same host-hiccup step (SHOULD 1) — the inbox, JAYWALK's next pass · a phone whose OWN
   mirror missed the GO took the stand-in seed; when the GO shows it restarts on the GO's clock with no taps (TOO SLOW) — rare (a hiccup
   on that phone AND the host), left for THE PROOF PASS · the go-live order: the CITY pass first; JAYWALK's boot budget ~0.3 KB.
