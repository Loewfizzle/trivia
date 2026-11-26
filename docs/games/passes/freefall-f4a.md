# FREEFALL — F4A: THE F3B FIXES + THE HIDDEN CARTRIDGE + COUNTING (switched OFF) + THE BOARD + THE CARDS (Nov 26 2026 — on the Beelink)

**RULES CHANGED — RE-PUBLISH `database.rules.json`** (Firebase console → Realtime Database → Rules → paste
`C:\Users\benja\Downloads\NEON\database.rules.nov26-ff-f4a.json` → Publish): `rooms/{CODE}/ff/{matchId}` (FREEFALL's proof node — `t0`,
`{uid}/go`, `c/{i}`, `h/{0..2}`, `e`, `k`) + `rooms/{CODE}/pt` (the tree counter takes `g: 'ff'`) — and whatever was still pending before
(the ack's line names it: `tests/fixtures/rules-live.ack.json`). **Nothing breaks before the re-publish:** a cartridge run plays UNPROVEN
(its own seed, NOT COUNTED — NO LINE TO THE BOARD); nobody but the owner can start the cartridge anyway.

The owner's decisions: `docs/games/plan.md` "FREEFALL — F4A (approved Nov 26)". The game's page: `docs/freefall.md` ("THE CARTRIDGE" ·
"THE PROOF" · "THE JUDGE ON THE SERVER + THE SWITCH" · "THE BOARD + THE AVERAGE" · "THE CARDS" · "THE F3B FIXES"). **FREEFALL STAYS
HIDDEN:** `playable` is false (a `preview` row — the owner's live test only); THE SWITCH is OFF — nothing counts. THE MATCH (ghosts, Call
the Winner, the podium, the finish), THE END SCREEN's logo header + SHARE = F4B.

## THE GROUPS (all built — nothing skipped)
| group | commit | what |
| --- | --- | --- |
| Step 0 | 8563998a | the owner's F4A decisions in `docs/games/plan.md`; `lab-export.mjs https://www.neonspeakeasy.com`: 226 marks, **no open FIX** (its date line only); the inbox: no entry for this pass (read at the start, after each group's commit, before the final tests) |
| 0 — THE F3B FIXES | 2508c497 | the haze after a breakthrough (measured, then fixed) · the gold YOU HIT THE BOTTOM band · the darkness's look by day |
| 1 + 2 + 3 + 4 | 4a76fe9c | THE HIDDEN CARTRIDGE · THE PROOF (`ff` + its rules) · THE JUDGE on the server · THE SWITCH (OFF) · THE BOARD + AVG · THE CARDS (one commit: they share the registration + the report's files) |
| THE FRESH-EYES REVIEW's FIXES + THE CLOSE | (this pass's last commits) | the table below; the docs, the final run, the inbox's OPEN FOR BEN |

## GROUP 0 — THE F3B FIXES
**THE HAZE AFTER A BREAKTHROUGH — measured first.** `tests/integration/freefall-play.mjs --haze`: the ball goes through and stays on
the first floor under it; the colour of the three floors below it (a safe slice's top on each — the stage's test hook `spot()` finds its
place on the screen at every reading: the camera still glides) is read off the picture 0.3 · 0.5 · 1 s after the hit and held against
3.5 s after it (a normal floor of that area, every effect long gone). Lightness / colour, the middle reading of the three floors:

| breakthrough | look | BEFORE 0.3 s | BEFORE 0.5 s | AFTER 0.3 s | AFTER 0.5–0.7 s | AFTER 1 s |
| --- | --- | --- | --- | --- | --- | --- |
| THE SKYLIGHT (40) | day | **−24 … −48 %** / −8 … −21 % | −18 … +6 % / −14 % | +0.5 % / −0.2 % | ≤ 0.1 % | 0 % |
| THE SKYLIGHT (40) | night | **−61 … −68 %** / −34 … −47 % | −23 … −29 % / −14 … −18 % | +3 % / −0.3 % | ≤ 1.8 % | 0 % |
| THE SPLASHDOWN (120) | day | ≤ 3.8 % (the ball STOPPED) | ≤ 2 % | ≤ 3.3 % | ≤ 2.1 % | ≤ 2.3 % |
| THE SPLASHDOWN (120) | night | ≤ 0.8 % | ≤ 0.3 % | ≤ 0.8 % | ≤ 0.8 % | 0 % |
| THE BOTTOM (200) | both | ≤ 0.5 % | ≤ 0.3 % | ≤ 0.1 % | 0 % | 0 % |

- **THE SKYLIGHT's cause: the roof's deck.** From the play camera the deck round the skylight lies IN FRONT of the floors under the
  roof; it faded out over 0.8 s after the break (F3B's review had made it fade at all) → the floors under it read 20–68 % dark for half
  a second, both looks. Now gone 0.25 s after the break (`break-fx.js DECK_F`).
- **THE SPLASHDOWN's causes (the owner's "~20 % less colourful + brighter on the floors 1–3 floors past it") show only while the ball
  FALLS ON** — a stopped ball's camera is already under the surface (the table's row). Two things lay on those floors for the first
  second: (1) by day THE HAZE the tower fades into was the BALL's area's, eased with a 0.45 s time constant — the speakeasy's warm haze
  (0.5 · 0.33 · 0.22) on the harbor's pearl floors where the harbor's own is deep blue: brighter + less colourful, up to 27 % of the
  haze's weight three floors down; a smaller lift at the skylight (the rooftop has almost no haze), none by night (the haze is the
  day's) — exactly the owner's report. **THE HAZE FOLLOWS THE FLOOR now, never the clock:** the border in sight splits the tower — the
  floors above it fade into their area's haze, the floors below it into theirs (`G.uFog` / `uFogB` / `uFogKB` / `uCaustB` / `uFogSeam`;
  the slices' + the pillar's shaders; as the palettes: a floor wears its own area's) — whole from the frame the ball goes through
  (the check reads the uniforms: the harbor's own haze under the surface BEFORE the ball gets there and in the frame it goes through).
  (2) the water plane swept off the floors over 0.6 s → **0.35 s** (`breaks.js WATER lineAt 0.05 · lineFor 0.3` — measured: 347 ms).
- **The covering debris is short:** the glass dust 0.28–0.42 s (it lay over the floors for a second, cover 0.4–0.5 → 0.25–0.3), the
  foam + spray 0.3–0.5 s; the glass shards are thrown clear of the tower's column (throw × 1.7) and live 1.0 s (1.5). A flying shard or
  glazing bar crossing ONE point is the moment's own debris, not a wash: the check takes the middle reading of the three floors.

**THE SOLO "YOU HIT THE BOTTOM" BAND.** It WAS the gold band in solo — F3B's own shots show it gold when it is whole and grey in its
0.26 s fade in / out (a band's keys: 16 % in, 16 % out of 1.6 s), with THE TRENCH's band a floor behind it: what read as "faint grey by
night, near-invisible by day" was the band at half opacity. The gold band now **SNAPS in (0.09 s), stays whole to 2.05 s of its 2.2 s**
and leaves fast (`banner.js BANNER_GOLD_MS / BANNER_GOLD_KEYS`) — solo + a finish alike; THE TRENCH's band crosses after it (checked:
whole 0.2 s after it comes and still whole at 1.8 s, both looks; pale gold words on its own dark ground).

**THE DARKNESS, look only** (timing, steps + rumble untouched — the rules' tests + the sims unmoved): by day the step's edge is a
DARKER rim of the cloud / the dark / the murk (`--ff-dk-edge`: 26 30 44 · 4 5 12 · 1 16 19) — the night's line of light was a pale
stripe through the big number by day; **THE LIGHTS ARE GOING OUT lies in the band's lane** (under the number: 136–162 px at 390 × 844,
the ball's highest point 176) — it ends 5 / 14 / 27 px above the ball's apex at 375 × 667 / 390 × 844 / 430 × 932 (a ball that lets the
darkness this close has stopped: no band, no call is up in that lane); **the day BLAZE!** = pale letters (#fff4d6) on a dark, warm
backing (it was orange on the orange flame).

## GROUPS 1 + 2 — THE HIDDEN CARTRIDGE, THE PROOF, THE JUDGE, THE SWITCH
- **How the owner starts it:** on his phone (the server's OWNER yes) — **PLAY → FREEFALL · TEST → PLAY NOW**, then the first DRAG.
  Nobody else is offered it (a stranger's shelf: the playable games, no FREEFALL; PLAY NOW refuses it; a non-owner's report is
  `not_reportable`).
- **The boot:** 306 / 310 modules · **6,499.2 of 6,500 KB — the budget NOT raised.** The boot stood at 6,499 KB; FREEFALL's hidden rows
  (the GAMES row, the meta row, the loader + the node lists, the stand-in mark, the board's row) need 1.3 KB → five long comment blocks
  of `js/config.js` moved VERBATIM to `docs/harbor/boot-headers.md` (the file keeps one line each). THE PER-GAME BUDGET: a new line
  (freefall 41 modules / 520 KB — its graph past the boot: 35 modules, 447 KB).
- **The proof** (`proof.js`, pure — docs/freefall.md "THE PROOF"): the node `rooms/{CODE}/ff/{matchId}/{uid}` = `go`, `c/{i} { s, at }`,
  `h/{0..2}`, `e`, `k`. THE INPUT LOG = the changed ticks only, packed (`replay.js#packLog`'s own text), chunked every 250 ms — and
  **only FINAL events go up**: the engine can still merge a later move into its last entry, never into one at or before a landing
  already decided, a hold, or the end (`finalCount`); a landing comes every 0.6 s at most. THE HOLD (solo): a logged event + **the way
  back STAMPED by the server** (`h/{i}`; the run goes on 2.4 s after it) — the speed check runs on THE RUN's CLOCK: the time away is no
  lateness, events past a hold with no stamp are CUT at that hold. The rules: HIGH RISE's `hr` block mirrored (the k-write rule too) +
  THE STAMP always required + the hold stamps + the packed log's alphabet.
- **The judge on the server:** `api/_lib/freefall.js` (pure — the 8 functions stay 8) → `verifyRun` / `freefallSolo` in
  `api/report.js`'s proof path (`PROOF_GAMES.freefall`; the match a stub until F4B; the daily off). The feats from the replay alone.
- **THE SWITCH:** `FREEFALL_COUNTS = false`. OFF = judged → `status: 'would_count'` + the would-award; nothing written (the `/api` test
  compares the WHOLE database outside the rooms before / after). `report.js#SWITCHED` = ONE path for HIGH RISE's kill switch +
  FREEFALL's (HIGH RISE's behaviour unchanged — its unit pins + its `/api` block are green).

## GROUPS 3 + 4 — THE BOARD + THE AVERAGE, THE CARDS
- `core/boards.js`: `freefall-solo` = DEEPEST RUN · FLOORS, `avg { days: 14, min: 5 }` — JAYWALK's JT2, generic: THE BOARD's rows + YOUR
  row (BEST, AVG n — a dash under 5), the game card's board preview strip, the server's answer (`o.av`; F4B's end card line is wired:
  `lines.js#bestAvgLine`). THE BOARD's FREEFALL tab: wired + hidden (`board/view.js#HIDDEN_TABS` — the owner's phone only).
- THE CARDS (hidden catalog): SPLASHDOWN (rare — floor 120) · TERMINAL VELOCITY (epic — 15 floors without a bounce; `terminal-velocity-v1.png`,
  the ORANGE fire) · ROCK BOTTOM (legendary — floor 200). `scripts/build-freefall-cards.mjs` bakes `assets/vault/ff/*.webp` (50 · 76 ·
  73 KB) from the masters OUTSIDE the repo; the slim cards' face to the RIGHT (the hero 0.792 · 0.785 · 0.777 across, clear of the tier
  gem; the left third's mean light 1.25 · 0.01 · 1.28 of 255). THE LAB 231–236. Awarded only by the three achievements on the feat flags
  of the SERVER's replay.

## THE CALLS MADE (obvious / established pattern — named, the owner may overrule)
- **THE SWITCH lives in code** (`api/_lib/freefall.js`, ONE line), as HIGH RISE's — go-live is a pass; the emulators get a test flip.
- **Tick 0 = GO + 600 ms** (the GO's answer + the sounds' decode fit inside it; the ball always drops in from the same height) — a GO
  answered more than 2.5 s late starts no proven run (the darkness would have most of its 3 s grace): that run plays UNPROVEN.
- **THE TOWER SPINS UP at the start** (one whole turn, 0.42 s): the opening stands on a stand-in tower — the real one's seed is picked
  by the server's time AFTER the first drag (nobody can shop for a tower) — and the swap is hidden in the spin. Reduced motion: no spin.
- **A hold's way back is stamped at the START of the 3 · 2 · 1** (the run goes on exactly 2.4 s after the stamp); no stamp (no line):
  the count runs again, up to three times, then the run goes on and says NOT COUNTED PAST THE PAUSE — the judge counts it up to that
  hold. A page hidden again in the count writes a new stamp at the next one.
- **A refresh mid-run ends the run where it stood** (the clock ran on without the page): its end is written from the node as it is,
  the podium follows. (HIGH RISE takes a run back up after a refresh — a tower waits; a falling ball does not.)
- **The end screen in the cartridge = the console's podium frame with the test page's card as its body** (the kicker FREEFALL · SOLO in
  THE END NEON's colours, PLAY AGAIN in the teal accent) until F4B's logo header; SHARE is not offered yet (no run card: F4B).
- **PLAY AGAIN goes back to THE OPENING** (the first drag starts the next run — as on the test page; HIGH RISE starts at once: its tap
  WAS the start, a drag is not).
- **A room of two or more can not start it yet** (COULD NOT START) — the owner's card still shows PLAY WITH FRIENDS (the console's
  card): F4B's match answers it.
- **The cartridge's YOUR BEST while the switch is OFF = this phone's own** (the test page's `ff:play:best`); once counting is ON it is
  the server's (`ff:best`).
- **The stand-in mark** (a ball over two rings) — the go-live's icon brief replaces it; it shows only on the owner's shelf + card.
- **The glass shards live 1.0 s (1.5) and fly wider** — so they clear the tower's column; the skylight keeps its 60 shards, its bars,
  its sparks.
- `VERIFIED_SOLO` + `PROOF_GAMES` + `SWITCHED` name FREEFALL now (hidden, OFF): the would-award is the real step's — at go-live nothing
  but the switch + `playable` moves.
- **An UNPROVEN run's PLAY AGAIN starts a NEW match** (the review): the host — the same phone, a room of one — marks the run ended
  (`game.x/{uid}`), the director closes the match (floor 0, never counted), THE INSTANT AGAIN starts the next one with its own GO. HIGH
  RISE's unproven card starts over in the spent match (BACK HOME → PLAY NOW is its counted way back) — FREEFALL's 2.5 s late-GO rule
  made that trap likelier.

## THE FRESH-EYES REVIEW (a subagent that did not build the pass — read-only on the repo; its own probes on the real code + the emulators in its own namespace; the shots as contact sheets)
**Verified sound (its own probes):** the chunks ARE the packed log — 400 bot sessions (517 holds, 49,147 late moves, 37,572 same-tick
cancels; 527,421 prefix checks) + 3,000 dense random walks (8,343,394 checks after every turn, cancel, step and hold): 0 broken,
`finalCount` never went back · the judge == the live run 400 / 400 (floor, tick, end, cause, best run, feats; 20–400 ms lag; the tail at
a hold sent before or after the stamp) · the rules unchanged (`git diff` on engine / tower-gen / tuning empty, replay.js only exports
`packMove`; the 2,000-seed sim to the digit) · 107 named hostile nodes + 20,000 random mutations: 0 threw, 0 counted above the honest
truth, the slowest 84 ms (300,000 junk keys) · too fast (all at once, 2×, 1.05×, a constant 2.1 s ahead) refused · `mirror` unreachable
on the server path · the feats at 119 / 120 / 199 / 200 and a best run of 13 / 14 / 15 / 16 right, shatters included · a room's own
results (no `sv`) earn no record, flag or average; the average = the last 14 played days from the 5th run · the report with the switch
OFF: a stranger 409 `not_reportable`, a stranger with the owner's GO planted 409, a match of two 409, a mismatched game 409 — nothing
written outside `rooms/`; with no emulator `freefallCounts()` is false; HIGH RISE + JAYWALK unchanged · 55 rules cases of its own (no
stamp / GO for a stranger, a non-participant, a kicked player; `pt` never without its stamp; `h` only on the own node after GO, only the
server's now, only 0–2, never after `e`) · the test page: 41 modules, none of them firebase, the proof or the cartridge · zero garbage
in the stage's new frame code (by reading).

| # | severity | the find | what was done |
| --- | --- | --- | --- |
| 1 | **HIGH** | an honest HELD run was REFUSED WHOLE when its hold stamp landed late: no line at the way back → three unstamped counts → the run goes on by the phone's clock and says NOT COUNTED PAST THE PAUSE — but the stamp's writes sit in the SDK's queue and land when the line is back; the judge then read every event after the hold as AHEAD of that clock and refused the run, the floors before the pause too (through the real report: stamped in time 130 · never stamped 40, cut · stamped 4 s or 30 s late: **0, refused**) | **FIXED:** `proof.js#clockProblem` — AHEAD past a hold is the same CUT as a missing stamp (counted through that hold; the run's first segment stays a refusal: a log made in advance); the phone sends nothing past a hold that got no stamp (`view.js` `capN`). Unit (a stamp 4 s · 30 s · 10 min late: cut at the hold, the same floor as with no stamp) + the `/api` test (30 s late: `would_count`, cut, the floors before the pause counted) |
| 2 | medium | a hold hides slow motion: the 8 s of play before each hold can arrive at any time (3 holds ≈ 24 s of play at any slowness, on top of JAYWALK's own 8 s lag + the 83 s dropped-signal window at a run's end) | **named, not changed:** the 8 s is THE DROPPED SIGNAL's own allowance on a frozen clock — tightening it cuts an honest phone that lost its line a few seconds before it was locked (its later floors would be lost). It needs a modified client, which can do far more (find 3). OPEN FOR BEN 6 |
| 3 | medium (the owner's call before go-live) | a PERFECT SCRIPT at 1× is a legal log: it reads the tower from the seed, stands on floor 200 at 1:00 with 0 bounces (floor 5,999 at the 30:00 cap) and would top the board; seeds can be shopped (GO, look, abandon) | **named** (known since F1 — docs/freefall.md "THE JUDGE": the speed check ties ticks to the server's clock, it can not tell a hand from a script; the same exposure as every replay game). Before `FREEFALL_COUNTS` flips: a plausibility hold (floors a minute, zero bounces over 100+ floors) — OPEN FOR BEN 6 |
| 4 | low | "nothing written" while OFF is not literal: `seen/{hash}/{pid}` (the account's hashed address — every report) + the route's call budget `rl/` are written | **named** (as HIGH RISE S4A: `noteSeen` is not an award; no progress node is written — pstats, profiles, lb, results, ppriv). The doc says so |
| 5 | low | after ONE unproven start every PLAY AGAIN on the stage's own card stayed uncounted until BACK (the match's one GO spent, its match never ended) — likelier here with the 2.5 s late-GO rule | **FIXED:** the host marks the unproven run ended (`game.x/{uid}`), the director closes the match, PLAY AGAIN = THE INSTANT AGAIN → a NEW match, its own GO (the e2e: PROVEN again). No line → the stage starts over in the same match, said so |
| 6 | low | the 3 · 2 · 1 could jump back up ("1" then "3") when the stamp's answer is slow | **FIXED:** the number never goes back up — it waits (the ball never jumped: the run resumes exactly at the stamp + 2.4 s) |
| 7 | nit | `SWITCHED[...]` lookups without an own-key check (`'constructor'`) — unreachable today (409 first) | **FIXED:** the switch table has no prototype |
| 8 | nit | FREEFALL's would-award carried HIGH RISE's `perfects: 0` | **FIXED** |
| 9 | nit | a comment said the average takes a floor-0 run; it does not (as JAYWALK's lane-0 run: `empty`) | **FIXED** (the comment) |
| look | low | the podium's kicker read "FREE FALL · SOLO" (two words) | **FIXED:** THE END NEON takes a word that joins the one before (`ui/fin-neon.js`) — FREEFALL · SOLO, one word in two colours |
| look | low | the full-card PREVIEWS (`cards\*-full.png`) show hard cuts at the art's top edge + a box behind the name | **named:** the previews are the build script's own drawing (it fades the left edge only); the real card's CSS fades all four (`.vl-fcm-ff-*`). THE LAB shows the real render — OPEN FOR BEN 4 |
| look | low | day, floor 200 (solo): a lighter patch with a straight edge top-right behind the number | **named** — F3B's seabed shelf's own edge in the far corner (not this pass's); F5 |
| look | nit | "SHARE · SOON" on the cartridge's own card is dev text | **FIXED:** the cartridge's own card has PLAY AGAIN + the way out alone |
| look | nit | at floor 40 the skylight's frame bar crosses the tower under the ball's floor (unlit by night) while the ball stays there | **named** — F3B's frame (in play it is passed in under a second); F5 |

**It could not check:** the cartridge's races in a real browser (a GO answered after the view is gone, a hide during the pending GO or
before tick 0, two hides during the count, a refresh mid-run, the parked stage) — by reading it found nothing beyond 1, 5, 6; a real
iPhone; the real full-card render.

## THE MEASURE (the mini PC, headless Chromium, 390 × 844 — `freefall-play.mjs --perf` + `--stutters`, after Group 0's shader change)
The haze fix adds two mixes to the slice shader (the floor's OWN area's haze + caustics); the roof's deck, the glass, the dust and the
foam only live SHORTER. Measured again on every tier, at 1× and 4× CPU, both looks, each breakthrough on its own row:

| where | looks × tiers × cpu | fps | frame ms (p50 · p95 · worst) |
| --- | --- | --- | --- |
| THE SPEAKEASY (floor 120, 9 shatters) | night + day · tiers 2 / 1 / 0 · 1× + 4× (12 rows) | 59.9 – 60.1 (one row 56.2 — the stall, below) | 16.7 · 16.8 – 17.2 · 16.9 – 18.2 |
| UNDER THE HARBOR (floor 162, the haze's own area — the changed shader's worst case) | day · tiers 2 / 1 / 0 · 1× + 4× (6 rows) | 59.9 – 60.0 | 16.7 · 16.8 – 17.1 · 16.9 – 18.0 |
| THE SKYLIGHT (through it, floor 44) | night + day · tiers 2 / 0 · 1× + 4× (8 rows) | 59.9 – 60.1 | 16.7 · 16.8 – 17.2 · 16.8 – 18.0 |
| THE SPLASHDOWN (through it, floor 124) | night + day · tiers 2 / 0 · 1× + 4× (8 rows) | 59.9 – 60.1 | 16.7 · 16.8 – 17.1 · 16.8 – 17.8 |
| THE BOTTOM, solo: the crack (floor 204) | night + day · tiers 2 / 0 · 1× + 4× (8 rows) | 59.9 – 60.1 | 16.7 · 16.8 – 17.1 · 16.8 – 18.1 |
| THE BOTTOM, a finish + the firework (floor 200) | night · tiers 2 / 0 · 1× + 4× (4 rows) | 60.1 at 1× · 58.8 – 58.9 at 4× | 16.7 · 16.8 – 17.1 · 17.5 – 18.0 at 1×; ONE frame of 83 – 100 ms at 4× (the firework's sound decode — F3B's own number, unchanged) |

**45 / 46.** The one red row — day · THE SPEAKEASY · tier 1 at 4× CPU: 56.2 fps, p50 16.7 · p95 16.8, ONE frame of 250 ms — is the build
machine's own headless stall (≈ 2 minutes into a browser's life; F3B's red row was the same stall on another row; that row run alone:
60.1 fps, worst 16.9 ms). Not the game's.

**A whole run at 4× CPU, the roof to the trench (floor 212), `--stutters` 2 / 2:**

| look | area | frames | worst ms | over 25 ms |
| --- | --- | --- | --- | --- |
| night | THE ROOFTOP · THE OFFICES · THE SPEAKEASY · THE DEEP · THE TRENCH | 2087 · 2160 · 2160 · 2214 · 598 | 16.9 each | 0 |
| night | UNDER THE HARBOR | 2121 | the machine's stall (one frame, @ floor 129) | 1 |
| day | THE ROOFTOP · THE OFFICES · THE SPEAKEASY · UNDER THE HARBOR · THE DEEP · THE TRENCH | 2088 · 2160 · 2160 · 2160 · 2214 · 595 | 17.3 · 17.6 · 16.9 · 17.0 · 16.9 · 16.9 | 0 |

No picture or band is made in a run (12 pictures a look, all on the GPU before the first drag). **THE CARTRIDGE adds nothing to a
frame:** the proof writer's `count()` reads one integer (`finalCount`), a chunk is packed only when a move became final (the static
ZERO GARBAGE scan of the stage's frame functions — `tests/freefall-play.test.mjs` — passes with the cartridge's hooks in), the writes leave on the writer's 250 ms timer — never in the
frame. The real iPhone is the owner's to feel (`&fps=1`).

## THE FINAL RUN (the mini PC, nothing else busy; this pass's own emulators + `serve.mjs --emu` on :5173)
| suite | result |
| --- | --- |
| `node --test tests/*.test.mjs` | **2,805 / 2,805** (F3B: 2,791 — + the proof 6, the cartridge 8) |
| `freefall-play.mjs` (the test page: every check of F1 – F3B + Group 0's `--f4a` 18: the haze 0.5 s + 1 s after each breakthrough, both looks; the gold band in solo; the darkness's plate + stripe; day BLAZE!) | **152 / 152** |
| `freefall-play.mjs --perf` · `--stutters` | **45 / 46** (the machine's stall, above) · **2 / 2** |
| `freefall-lab.mjs` | **57 / 57** |
| `e2e-freefall.mjs` (NEW — the cartridge on the emulators: hidden from a guest, the owner's PLAY → TEST → PLAY NOW, the GO, the chunks, a hold + its stamp, the end, the judge's row, WOULD COUNT, PLAY AGAIN = a new match, an unproven run, a refresh mid-run, THE SWITCH off = nothing written / on = the row + the card) | **56 / 56** |
| `e2e-smoke.mjs` (THE PAGES LOAD, Chromium + WebKit, incl. /freefall-play + /freefall-lab; 11 hidden games can not be started) | **28 / 28** |
| `e2e-highrise.mjs --fast` · `e2e-jaywalk.mjs` FAST (the two games that share the proof kit + the report route) | **114 / 114** · **122 / 122** |
| the harbor suite, `ONLY=cartridge` (the group the registration touches; the WHOLE harbor suite is the cloud's, on the tagged push) | **3 / 3** |
| `rules.test.mjs` (+ the `ff` block: the stamp, the GO once, chunks in order, the chunk's alphabet + size, `h/0..2` = now, `e` once, nobody else's node, a locked node) | **105 / 105** |
| `server.test.mjs` (+ the FREEFALL F4A block: the replay = the live run, THE SWITCH off writes nothing / on pays, the feats from the replay alone, a refused node, a hold with no way back = CUT, a late stamp = CUT, the average's row) | **77 / 77** (the FREEFALL block alone, 5 runs in a row on a used database: 5 / 5) |
| the 2,000-seed sims (`tests/freefall-sim.test.mjs`, inside the unit run) | **F2's table to the digit** — sloppy 62 · good 136 · great 245 · human 149; a match's great bot 200 at 2:30 (76.2 %); a staller out in 9.0 s. Floors 0 – 199 bit-identical: the rules were not touched (the engine + the replay only GAINED exports) |

**One test fixed in the final run (the test, not the code):** the `/api` block's two HOLD fixtures placed their hold by the run's END
tick — a bot that stops moving at its `maxFloor` then had NO move after the hold, so there was nothing to cut and the judge (rightly)
cut nothing. The hold now sits at 40 % of the run's MOVES and the fixture asserts more than 5 moves follow it.

**The inbox** (`Downloads\NEON\ADDONS.md`) read at the start, after Group 0's commit, after Groups 1 – 4's commit and before the final
tests: 257 lines each time — **no entry for FREEFALL F4A / the next pass.** **The servers** this pass started (the emulators, `serve.mjs
--emu` on :5173) are stopped as its last step; the owner's :5190 was never touched.

## OPEN FOR BEN
1. **RE-PUBLISH the rules** — `C:\Users\benja\Downloads\NEON\database.rules.nov26-ff-f4a.json` → Firebase console → Realtime Database →
   Rules → Publish (it carries everything still pending from before too). Nothing breaks before or after: until then a cartridge run
   plays UNPROVEN (NOT COUNTED — NO LINE TO THE BOARD).
2. **Phone-check the Group 0 fixes** (the test page, after the deploy): https://neonspeakeasy.com/freefall-play?floor=118&look=day — fall
   on through THE SPLASHDOWN: are the first floors under the water at full colour now? (That case — the ball FALLING ON — is the one the
   mini PC can not measure: the check stops the ball on the first floor; its two causes are fixed by construction — the haze belongs to
   the floor's own area, the surface is off the tower in 0.35 s.) `?floor=38` (THE SKYLIGHT: the floors under the roof were 20–68 % dark
   for half a second) · `?floor=198` (the gold YOU HIT THE BOTTOM band in solo) · by day: stop moving until THE LIGHTS ARE GOING OUT (the
   plate above the ball, no pale stripe through the number) · a day BLAZE! (three clean floors).
3. **Phone-check the cartridge** (after the re-publish): PLAY → FREEFALL · TEST → PLAY NOW → drag → a run → the end card's small line
   **WOULD COUNT · FLOOR n · +XP** → PLAY AGAIN. Lock the phone mid-run: PAUSED → 3 · 2 · 1 → on — and the line still says WOULD COUNT
   for the whole run. Before the re-publish the same path says NOT COUNTED — NO LINE TO THE BOARD on the run and its card.
4. **THE CARDS in THE LAB** (231–236): SPLASHDOWN · TERMINAL VELOCITY (the orange fire) · ROCK BOTTOM — mark them. They are the picture
   alone (no moving layer yet): say if any of them should move before go-live.
5. **THE START in the cartridge:** the tower SPINS UP once (0.42 s) as the run begins — it hides the swap from the opening's stand-in
   tower to the real one (its seed is picked by the server AFTER your first drag). Good, or a different cover (a flash, a fade)?
6. **Before go-live (not now) — the two exposures the reviewer measured:** (a) a modified client can run a PERFECT SCRIPT in real time
   (floor 200 in 1:00, no bounce) — the judge can not tell a hand from a script (known since F1; true of every replay game): want a
   plausibility hold for the board (e.g. floors a minute, zero bounces over 100+ floors → held for your review in /admin)? (b) each of
   the 3 holds lets the 8 s of play before it arrive at any time (≈ 24 s of slow play a run for a modified client) — tighten it (an
   honest phone that lost its line just before being locked would then lose its later floors), fewer holds for a counted run, or accept?
7. **Named calls, yours to overrule** (the list above): tick 0 = GO + 0.6 s · a GO answered more than 2.5 s late = an uncounted run ·
   a refresh mid-run ends the run where it stood · PLAY AGAIN goes back to THE OPENING · the cartridge's end screen = the console's frame
   with the test page's card until F4B's logo header · PLAY WITH FRIENDS on your FREEFALL card can not start a match yet (F4B) · the
   stand-in mark · the glass shards fly wider + shorter.
8. **Named, not changed (F5 candidates):** day, floor 200 in solo — the seabed shelf's straight edge shows top-right · the skylight's
   frame bar stays across the tower while the ball stands on floor 40 · F3B's still-open: the soft roof at floors 36–39 by day, a DAY
   finish celebration.
9. **The speed numbers are the mini PC's** — the real iPhone is yours to feel (`&fps=1`). The haze fix adds two mixes to the slice
   shader; the speed test's table is in THE FINAL RUN.
NEXT: **FREEFALL F4B** — THE MATCH + THE END SCREEN (the logo header) + SHARE + the run card.
