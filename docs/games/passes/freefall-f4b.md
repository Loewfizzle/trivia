# FREEFALL — F4B: THE MATCH + THE END SCREEN (THE LOGO) + THE SHARE CARD (+ two fixes) (Nov 26 2026 — on the Beelink)

**NO RULES-FILE CHANGE — nothing to re-publish** (F4A's `ff` block already took a match: the GO window of the count's last 2 s, THE
STAMP, the leaf writes gated on the player's own `go`, `k`). **FREEFALL STAYS HIDDEN:** `playable` is false (a `preview` row — the
owner's live test only); THE SWITCH is OFF — nothing counts (WOULD COUNT lines only).

The owner's decisions: `docs/games/plan.md` "FREEFALL — F4B (approved Nov 26)". The game's page: `docs/freefall.md` ("THE MATCH" · "THE
GHOSTS" · "THE DEPTH RAIL + THE EDGE MARKERS" · "THE END SCREEN" · "THE SHARE CARD" · "THE TWO FIXES").

## THE GROUPS
| group | commit | what |
| --- | --- | --- |
| Step 0 | 635d054d | the owner's F4B decisions in `docs/games/plan.md`; `lab-export.mjs https://www.neonspeakeasy.com`: 232 marks — the three FREEFALL cards APPROVED (231–236), **no open FIX**; the inbox: no entry for this pass |
| 0 — THE TWO FIXES | 2e09d0e5 (+ 18e96bd1: the file hashes) | THE PAUSE GAP (the judge + the kit's proof-writer + the phone) · THE SKYLIGHT's FRAME BAR |
| 1 — THE MATCH | 1decbf39 | the rules (`match.js` · `director.js`), the judge of a match (`proof.js#judgeMatch`, the server's `freefallMatch`), THE GHOSTS (`ghosts.js` · `ghost-fx.js`), THE DEPTH RAIL + the edge markers (`matchhud.js`), the stage's match mode + the test page's bot room (`matchsim.js`), the cartridge's match screen (`view.js`) |
| 2 — THE END SCREEN | 1decbf39 | THE LOGO header, YOUR BEST · AVG, YOUR TABLE, the universal footer — the test page's card + the cartridge's podium body (solo + match) |
| 3 — THE SHARE CARD + SHARE | 792bc647 (a subagent in its own worktree) · b73f5bc8 (merged into the match + the end screen) | the real end frame, the card, SHARE in the footer |
| the reviews' fixes + the match's E2E | 7db5b357 | the two fresh-eyes reviews' finds fixed (the tables below), `e2e-freefall-match.mjs` |
| the close | (this commit — the tagged push) | the speed test's tags, the end card's room under the SOUNDS row at 430 + desktop, the docs, THE FINAL RUN |

## GROUP 0 — THE TWO FIXES
**THE PAUSE GAP** (F4A's OPEN FOR BEN 6 b — the owner: "CLOSED: a pause is granted only after the moves before it are sent + stamped;
nothing arrives late"). F4A froze the run's clock at ANY hold: the chunk that carries a hold — and the 8 s of play before it — could
arrive at any time (a locked phone's tail minutes later; a modified phone's slow motion: ≈ 24 s of slow play a run).
- **The judge** (`proof.js#clockProblem`): a hold freezes the clock **only when it was GRANTED — its own chunk (the hold + every move
  before it) arrived within 2 s of the hold's tick** (`CLOCK.grant`). A later one was no pause: the clock ran on (the chunks before it are
  held to the running clock), and the run is **CUT before the hold's chunk** (`cut.why: 'pause'`) — an open dropped-signal burst before
  an ungranted pause does not count either. More holds than the mode has (a match / the daily: ANY) = `too many holds`, named BEFORE the
  clock (a cut never turns it into a shorter honest run).
- **The writer** (`kit/proof-writer.js`): `flush('now')` — what is logged leaves AT ONCE, even behind a chunk still in the air (one
  socket, in order; a refusal among them is found by the rewind as ever). A phone being locked may not live to see the chunk in the air
  answered — the old path sent the hold only after that answer.
- **The phone** (`view.js` · `stage.js`): on hide the held run's log leaves `now`; back on screen `resume()` first asks the SERVER's copy
  of the chunks whether the hold's chunk was stamped within 1.5 s of the hold (`GRANT_PHONE_MS` — its own margin under the judge's 2 s).
  Granted → the way back is stamped as before. Not granted → no stamp, ONE count (never three), and the run goes on saying **NOT COUNTED
  PAST THE PAUSE** — nothing past that hold is sent.
- **What an honest phone sees:** nothing new on a working line (the hold's chunk lands in ≈ 0.1–0.4 s). A phone locked with NO line: that
  pause is not granted — its run counts up to the moves it had sent (before F4B it counted the whole run whenever the line came back).
- **Tests:** `tests/freefall-proof.test.mjs` (a pause 2.4 s · 8 s · 3 min late: CUT before its chunk, the first pause kept · up to 1.95 s
  late: granted, the run whole · THE SLOW-MOTION PHONE — the 8 s before the hold played over a minute, sent with it: nothing of it counts ·
  the first hold ungranted: no later segment has a say · a 4th hold: refused by name with or without stamps) · `tests/proof-writer.test.mjs`
  (`flush('now')`: one WAY after the hide, not a round trip + a way; a refusal among them still found + sent again) · the `/api` test (a
  late pause through the real report: `would_count`, cut) · `e2e-freefall.mjs` (an honest pause on the emulators: granted, stamped, whole).

**THE SKYLIGHT's FRAME BAR** (the owner's iPhone, night, floor 40). Shot first (`Downloads\NEON\freefall-f4b\framebar-before\`): with the
ball standing on floor 40 the frame's NEAR outer bar (+ its dead tube) lay across the whole screen at the ball's height, its far bar +
side bars as a dark bar under the number — until the camera had gone six floors on. **Now the outer frame + its eight neon tubes let go
WITH the pane**: they drop away (each a touch after the other), the short's cascade runs inside that fall, and they are **gone 0.25 s
after the break** (`break-fx.js FRAME_GONE_S` — the deck's own 0.25 s); the glazing bars' pieces fall with the shards (0.8 s, was 1.3);
the deck is not drawn at all 0.3 s on, no piece of the frame 1.6 s on. The sparks carry the moment. Check shots (floor 39 → 40 at 0.3 ·
1 · 2.2 s → 41, both looks, 390 × 844 @3 · 375 × 667 · 430 × 932): `Downloads\NEON\freefall-f4b\framebar\`; the browser check:
`freefall-play.mjs --f4b` (the flags at 0.45 s + 1.75 s after the break, three sizes, both looks).

## THE CALLS MADE (obvious / established pattern — named, the owner may overrule)
- **A pause's grant = 2 s** (the judge; the phone asks for 1.5 s). The cover (PAUSED) is up at once as before — the page is hidden then;
  what the owner's note calls "PAUSED shows ~0.3 s later" is the GRANT: the pause COUNTS once its chunk is stamped.
- **A match keeps JAYWALK's / HIGH RISE's numbers:** a 3 s count, the GO written 1.8 s before its end, tick 0 = THE FIRST GO + 2 s, a
  silent phone out after 18 s (online) / + 75 s (offline), an unproven match ends after 90 s, the podium waits ≤ 3 s for this phone's own
  run, the OUT card 2.3 s (THE BOTTOM 3.6 s), Call the Winner from 1.5 s after an out.
- **The chunks keep the solo run's 250 ms** in a match (the owner: ~200–250 ms) — a rival's ghost is at most a landing + a flush old.
- **WATCH THE LEADER is a playback 1.5 s behind the world** (exact, tick for tick) — the ghosts in play are at the world's tick (stepped
  conf → run, as the plan says); only the watched tower is delayed.
- **THE EDGE MARKERS:** below me from 5 floors ("MIA ↓12"), ABOVE me from 2 floors ("↑3") — the picture ends sooner upward (the ball's
  floor lies a third down the screen); three at most each way, the nearest first; down at the foot, up beside the rail's head.
- **A ghost above me** (in the number's + the band's lanes) is fainter and wears no tag; **within ≈ a floor of my ball** every ghost is an
  outline with no tag (the plan) — at the start everyone stands on the same slice.
- **The top line in a match:** YOUR BEST 88 · 4 PLAYING (the prototype render's). **The last half minute shows a small clock** (0:27, top
  left) — the 3:00 cap is otherwise unannounced.
- **No announcer calls for rivals** (passes, outs): the rail + the markers say it; the plan names none.
- **The test page's SHARE** hands the phone's own share sheet a line + the page's link (no card, no server: nothing counts there — the
  page's module graph holds nothing of share / the profile); the RUN CARD is the cartridge's.
- **A match's podium body** = HIGH RISE's: your cause · "57 FLOORS · YOU FINISHED 2ND" · your call's result; the console lists every
  place as slim cards under it. A match's floor raises YOUR BEST once counting is ON (the same board — the server's rule since F4A).
- **THE AVERAGE on the end card** shows once the server sends one (counting ON); while the switch is OFF: YOUR BEST · n alone.

## THE FRESH-EYES REVIEW — the rules / proof / server side (a subagent that did not build the pass; read-only on the repo; its own probes on the real code, the emulators in a namespace of its own)
**Verified sound (its own probes):** HOSTILE MATCH LOGS — ~110 targeted nodes (over MAX SPIN · non-canonical text · junk types · giant
+ prototype-ish keys · holes · swapped texts · backwards times · too fast · slow motion) each refused by name or cut to its last on-time
event; **a hold in a match: 14 variants → always `too many holds`, never a cut**; a late GO (5,001 ms) → `late go` on the host AND the
server; two GOs in one millisecond → the same seed either order; **a fuzz of 60,000 mutations of six 8-player sims: 0 throws, every one of
the 16,235 accepted nodes equals the live engine on exactly the events the judge kept — none above** · THE JUDGE vs LIVE — **3,400 rooms,
24,822 rows** (2–8 bots, lines 0–40 ticks, flushes 5–30 ticks, forged game starts): the host's row == the server's row == the bot's own
run in all, the placings identical in all; the cap + floor 200 edges right · THE HOST (report-level, both switch states): his forged 999
never read; dropping the leader / "his solo run" / deleting the leader's seat → three players, the leader credited; a stranger 403; OFF →
`would_count` only · THE PAUSE GAP's judge: an honest line of 50 … 2,000 ms → whole, 2,001 ms → cut; a fuzz of 20,000 held nodes: judge ==
engine on the kept prefix in all 18,522 accepted — no hold raised the lateness of a kept event · THE GHOSTS: 300 rooms / 1,200 ghosts /
7.66 M frames on lines of 0–6.7 s: never OUT / MADE before their own `e`, 0 wrong ends, 0 throws; WATCH exact in 3.98 M checked ticks; 18
hostile node kinds: no throw, no hang; `stepGhost` / `copyState` / `liftOf` allocate nothing (0.0–0.7 B a call over millions).

| # | severity | the find | what was done |
| --- | --- | --- | --- |
| 1 | **HIGH** | THE PAUSE GAP's PHONE HALF read its own UNSENT chunk: `granted()` asked "the server's copy" with a `get` — under the room's live mirror the SDK answers from its LOCAL view, where a chunk still queued behind a dead line shows with the phone's own guess of its time (the probe: answered in 1 ms while offline, "1 ms after the hold" — the server's real stamp: + 3,128 ms). In exactly the case the check exists for the phone stamped the way back and played on with no note | **FIXED:** the hold's chunk is asked about only once its WRITE IS ACKNOWLEDGED (the writer's `acked` covers the hold's event — then its `at` is the server's); not acknowledged in the count's time = no answer: the count runs again (three times), then NOT COUNTED PAST THE PAUSE. A static pin + `e2e-freefall.mjs` section 6b (the line dropped, then the page hidden) |
| 2 | **HIGH at go-live** (the switch is OFF today) | THE SORE LOSER — the port dropped the twins' rule: a loser appends ONE bad chunk to his own node (a hold · a turn over MAX SPIN · a move after his end — the rules take a chunk until his own `e`) → his row refused → `played` lost him → the WINNER was counted for a match of one (no win, solo XP) | **FIXED:** `api/_lib/freefall.js#prefixFloor` — a refused on-time node still PLAYED when its longest judge-accepted chunk prefix passed a floor (a binary search: ≤ 14 replays); its own row stays refused. Unit: three kinds of sabotage, the match stays a match of three |
| 3 | **HIGH — older than this pass** (F4A's solo GO + `js/games/highrise/go.js`, LIVE for HIGH RISE) | THE SOLO GO could adopt the phone's own GUESS of the GO: the GO was a plain `set(serverTimestamp)`, and the helper's periodic look at the node (while the write was in the air) saw the phone's estimate → the phone played one tower, the judge replayed another (the probe: the look at 423 ms took E, the server stamped E + 654 ms) | **FIXED for FREEFALL:** its solo GO is a TRANSACTION never applied locally (as a match's). **HIGH RISE is live and not this pass's:** → the inbox (TO HIGH RISE — NEXT PASS) + OPEN FOR BEN 3 |
| 4 | medium (inherited: JAYWALK's clock) | a run that ENDS inside a dropped-signal burst is taken whole — the tail of a run can be played slowly behind a silence of up to ~83 s (the docs' "back on the clock within 15 s" is only held against LATER chunks) | **named** — an honest death during an outage looks the same; the owner's call (mark such a row `late`?): OPEN FOR BEN 4 |
| 5 | low (shared `api/report.js`) | a host can VOID (not rob) a proven match: `game.unproven = 1` on the final game → 409 for everyone while the room sits on it | **named** (all three proof games) → the inbox |
| 6 | low | the cap's grace (4 s — HIGH RISE's) was shorter than the judge's own lateness (8 s): a capped run on a 5 s line was scored a floor short by the host's step while the server had every chunk | **FIXED for FREEFALL:** `match.js END_GRACE_MS` 9 s. HIGH RISE's 4 s → the inbox |
| 7 | low | WATCH rebuilt its playback at every chunk on a line slower than ~1.4 s (155 rebuilds in 155 s) | **FIXED:** the delay follows the rival's own lateness (+ 0.5 s at each rebuild, ≤ 5 s — `WATCH_DELAY_MAX`) |
| 8 | nit | WATCH could show an OUT a beat before `e` (the fatal landing at the last landed move's own tick) | **FIXED:** that landing waits for their `e` too |
| 9 | nit | the phone's `holdSrv` is a second clock (the judge uses the run's own); past 2 s the judge cuts BEFORE the hold's own chunk — "past the pause" is a touch generous | **named** |
| 10 | nit | `scoreCalls` takes a refused row as "still in"; `goOf` takes `true` as a GO — unreachable under the rules; the twins identical | **named** |
| 11 | note | ties for first are common: the finishing tick is quantised by bounces — 175 of 3,000 eight-bot rooms tied for 1st (23 of 400 at floor 200) | OPEN FOR BEN 5 |

**It could not check:** the web bundle (11.10.0) in a browser — finds 1 + 3 are proven on the SDK's own Repo code from node_modules; a real
iPhone (whether the hold's chunk leaves the socket before iOS freezes the page — how often an honest pause is granted at all); the cap
in the 8-player sims (the bots never reach 3:00).

## GROUP 1 — THE MATCH: the real thing on the emulators (`tests/integration/e2e-freefall-match.mjs` — written + run by a subagent that did not build the match; 3 phones + a late joiner + 8 phones, headless Chromium)
| part | checks | what was seen |
| --- | --- | --- |
| a 3-player match | 58 | 3 · 2 · 1 + the names on all three; three GOs 0–24 ms apart; THE SAME seed + tick 0 everywhere; each proof node fills with server-stamped chunks; a rival's ghost at most 1 floor off its real floor; an edge marker ("ALICE ↓21"); the OUT card, Call the Winner (`k` written), WATCHING the leader, a tap = the next; ALICE `made` floor 200 at 67.8 s; the podium's rows == `freefallMatch` to the floor + the tick; the call's + 0.4 on the night record; WOULD COUNT on all three; nothing written outside `rooms/`; REMATCH = a new id, count, seed |
| a phone that locks · drops signal | 13 | hidden 3 s: never PAUSED, no hold, the run went on (floor 4 → 7); hidden 10 s: THE LIGHTS WENT OUT behind the page, the row valid, no cut; a 6 s signal drop: the player fell on, his ghost was never OUT on the others' screens, the chunks landed together — judged honest, whole, by the host AND the strict server |
| a refresh mid-match | 4 | the reloaded phone took its own run back up (195 moves replayed, the new chunks behind the old) |
| a late joiner | 11 | a spectator: no node, no GO, 3 ghosts + 3 dots, the watched run falls; sees the podium without a row; dealt in at the REMATCH |
| a host change mid-match | 6 | the next phone became host 8 s after the owner's closed; `final` 93 s after the death (18 s idle + the dropped signal's 75 s); the rows == the judge's, the dead phone's too. REMATCH on a guest's phone says "Coming soon" (only the owner starts the hidden game — by design until go-live); ROOM is the way on |
| an 8-player match | 17 | 8 WebGL pages on this machine (60 fps on the one measured, worst frame 17 ms); 7 ghosts + 8 dots on every phone; ghosts at most 1 floor off over ≈ 6,300 samples; the podium lists 8 in the judge's order on all phones |
| the 3:00 cap (`--cap`, run once) | 16 | the clock "0:29" on both; both `cap` at tick 10800 (floors 183 / 181); THE BELL · TIME'S UP; `cap` rows from the host + the server |

**What it found in the game (all fixed here):** the WATCHING line named a dead phone for the whole 93 s wait (a rival with no news is never
"over" on this screen — the words now count the ones seen falling: WAITING FOR ALICE · NO SIGNAL) · **the out's order was wrong** — the
watch began 0.9 s after an out, under the OUT card, and the call's sheet then opened over both → **the cause's words (2.3 s) → Call the
Winner → WATCH** (`CALL_AFTER_MS` · `WATCH_AFTER_MS`) · the finish's card ("YOU HIT THE BOTTOM") was clipped at 390 → a smaller face in
a narrower box · the watch line + the call's words wrapped to three lines at 390 → **two short lines** (WATCHING CHARLIE · 20 / YOUR CALL ·
ALICE · TAP FOR THE NEXT), the down-markers step up over them · the tags' + the markers' colours were washed toward white → more of the
player's own colour. **Named, not changed:** a COLD first start can miss the count's "3" (a fresh room's phones showed 2 · 1 · GO — the
view + the scene load inside the 3 s; nobody was late; a rematch always shows 3 · 2 · 1 — JAYWALK's + HIGH RISE's count is the same
3 s) · the console's own podium list (a row's note + score read as the next card's; the YOU row cut by MORE BELOW with 8 players) —
shared by every game.

## THE NETWORK — an 8-player match against the free Spark plan (measured: the WebSocket frames' payload per phone over CDP + the proof tree over REST; the checks' hand turns nearly every tick — a busy player; TLS + framing not counted)
| players (all falling) | writes a minute (a player) | up a minute (a player) | down a minute (a phone) | a 3:00 match: writes · up · down in all (a phone) |
| --- | --- | --- | --- | --- |
| 2 — a real 3:00 match | 243 (122) | 40.9 KB (20.5) | 85.9 KB (43.0) | 729 · 120 KB · **252 KB** (126 KB) |
| 3 — a 14 s window × 3 | 452 (151) | 71.1 KB (23.7) | 214 KB (71.4) | 1,356 · 208 KB · **628 KB** (209 KB) |
| 8 — a 40 s window × 3 | 1,063 (133) | 164 KB (20.6) | 1,237 KB (155) | 3,189 · 482 KB · **3.62 MB** (453 KB) |

- A chunk's own text is small (≈ 16.6 KB a minute for 8 players; the tree grows ≈ 46 KB a minute); **the download is the cost** — every
  phone mirrors the whole `ff/{matchId}` tree: ≈ 25 KB a minute of its own traffic + ≈ 18 KB a minute a rival, so the total grows with
  N × (N − 1).
- **Against Spark's 10 GB a month of download:** ≈ **2,900 full-length 8-player matches** · ≈ 16,000 3-player · ≈ 41,000 2-player (a
  real match ends sooner: the 8-player one as played — 52 s, everyone out — was 825 writes, ≈ 128 KB up, ≈ 0.96 MB down). 100
  simultaneous connections = 12 full rooms of 8 at once. **Nothing trimmed:** the 250 ms flush + FINAL-events-only chunks already keep
  a player at ≈ 2.2 writes a second; a slower flush would only make the ghosts older.

## THE FRESH-EYES REVIEW — the SCREEN side (a second subagent that did not build the pass; read-only; ≈ 75 shots looked at singly, in contact sheets and as native-pixel crops, contrast measured from the pixels)
| # | severity | the find | what was done |
| --- | --- | --- | --- |
| 1 | **HIGH** | the match podium with 8 players, my row under the fold: an EMPTY PINK GLOWING FRAME round ROOM · SHARE — THE YOU ROW's glow (z 4) painted over the frame's sticky foot (z 3) | **FIXED** for FREEFALL's podium (`.ff-final .final > .final-actions` above it). The same two numbers stand in the shared sheets (`css/vault.css` · `css/components.css`) → the inbox, to the city chat |
| 2 | **HIGH** | a ghost's TAG faded with its ball in the hand-over to the edge marker — 1.8 : 1 (day) · 2.0 : 1 (night), for seconds while a rival paces me five floors down — and the same rival was named twice (the tag + "↓5") | **FIXED:** a tag never fades — it is whole while its ball is at least half there, then gone; the marker names the rival from there |
| 3 | medium | THE FRAME BAR: the outer frame was gone at 0.3 s — but the GLAZING BARS still hung in front of the top two floors as ≈ 10 straight sticks (each turned about its own length — invisible — and had dropped a third of a unit): a lattice, not debris | **FIXED:** they TUMBLE about a tilted axis of their own, are thrown outward from the pane's middle, fall as fast as the frame and are gone in 0.45 s (re-shot: debris among the shards) |
| 4 | medium | a ghost ABOVE me at the top edge: a dim untagged disc beside the ☰ button, cut by the screen's edge — a smudge | **FIXED:** above me a ghost thins out to nothing by two floors up (its "↑n" marker names it from there) |
| 5 | medium | the match podium's fit at 390 × 844: the third row is cut by the fold, MORE BELOW sits on that card's edge, the WINNER block's room stands empty for its first moment | **named** — the console's own podium (every game's); with the logo header FREEFALL's is ≈ 100 pt taller than a one-line kicker: OPEN FOR BEN 6 |
| 6 | medium (the owner's call) | A MATCH's end screen has the logo, MATCH, the cause and "16 FLOORS · YOU FINISHED 3RD" — no big number, no YOUR BEST · AVG, no stats line (the spec lists them without a match exception) | **named** — JAYWALK's + HIGH RISE's match body (the plan: "the match card's podium / YOUR TABLE as JAYWALK's"); the big number would push every standing under the fold at 390: OPEN FOR BEN 6 |
| 7 | medium | THE SHARE CARD's HIT THE RED frame was the impact's own instant: the slice white-hot, the ball gone — under the tab it read as a white wedge | **FIXED:** `SHOT_AT.red` 90 → 200 ms (the slice red again, a pale flash on it, the sparks spread in the air) — the cards re-shot |
| 8 | medium | the end screen on a phone held SIDEWAYS: SOLO + the stats line 7.5 px, the note 7 px, FLOORS + the links 9 px | **FIXED:** nothing under 9 px there (the mode, the stats line, the note 9 · FLOORS + the links 10) |
| 9 | low | the podium rows' captions (HIT THE BOTTOM · THE LIGHTS WENT OUT): small + dim; my rank a dim pink | **named** — the console's own list (every game's) |
| 10 | low | the desktop end screen's logo: 44 % of its 540-pt column (the 250 px cap) | **FIXED:** the cap 320 px |
| 11 | low | the WATCHING line's second line with a 12-letter name ("YOUR CALL · CHRISTOPHERS · TAP FOR THE NEXT") would wrap at 375 / 390 | **FIXED:** beside a call the hint is short (TAP: NEXT) |
| 12 | low | the count with 8 players: two rows of names lay on the top floor + across my ball | **FIXED:** the names stand ABOVE the number |
| 13 | low | Call the Winner: the rail's line + a dot showed through the sheet's right edge | **FIXED:** the rail is hidden while the sheet is up |
| 14 | low | the share card's night gold frame is ≈ 60 % white bloom (the day one is good); THE LIGHTS WENT OUT cards show a lit floor with the card's own dark round the ball | **named** — OPEN FOR BEN 7 |
| 15 | low | the card with NO frame (a fallback: the frame was never taken): an empty dark box, block letters for the logo | **named** — the fallback only |
| 16 | nit | three wordings for one end (MADE IT TO THE BOTTOM on the end card · YOU HIT THE BOTTOM on the share tab + the band · HIT THE BOTTOM in the podium's rows); "0 BLAZES" in fire orange | **named** — OPEN FOR BEN 7 |

**Found right (its own measures):** the tags in their crisp state (13.5 px / 800, a near-black rim, sharp at 3 ×, stacked — never overlapping
— clear of my ball; a 12-letter name fits) · the see-through ball + the day's dark rim on gold, pearl and over the water (LIAM's yellow on
the speakeasy's gold — the hardest case — passes on the rim alone); a half-hidden ghost reads through the floor · at the start the near
rivals are thin rings and my ball is the only solid one · the rail (2 px, my dot 18 px, an out crossed, the gold foot; clear of the music
button; no pill anywhere) · the markers (↓ ↑ render, outlined on every floor colour, never on the number or the band) · the top line
(≥ 72 pt clear each side at 375) · the end screen at 375 / 390 / 430 in both looks (the logo's ink 54 %, nothing clipped, the dim lines
5.2–6 : 1) · the footer (one bar + two quiet icon links, no boxes) · the share cards at 360 px (every line reads, nothing under ≈ 13 px,
no pill, CHRISTOPHERS fits, the gold card consistent). **It could not judge:** motion; a real iPhone; the AVG line + YOUR TABLE in the
cartridge (the board has no rows while the switch is OFF); a day match in a real room.

## THE MEASURE — 60 fps with 8 ghosts (the mini PC's Chromium, a real GPU, 390 × 844; `freefall-play.mjs --perf8`: a 6 s window of real play in the bot room — 8 rivals held round my ball so every ghost + its tag is drawn every frame; `--perf` = F4A's solo table, `--stutter` = the two long runs)
| look · floors | tier 2 (@3) 1× · 4× CPU | tier 1 (@2) 1× · 4× | tier 0 (@1.5) 1× · 4× | ghosts · tags drawn |
| --- | --- | --- | --- | --- |
| night · THE SPEAKEASY (floor 120) | 60.0 (p95 17.0 · worst 18.2 ms) · 60.0 (16.8 · 17.0) | 60.0 (16.9 · 17.6) · 60.0 (16.8 · 16.9) | 60.1 (16.9 · 18.0) · 60.0 (16.8 · 16.9) | 8 · 6 |
| day · THE SPEAKEASY (floor 120) | 60.1 (17.0 · 17.8) · 59.9 (16.8 · 17.0) | 60.0 (17.0 · 17.8) · 60.0 (16.8 · 17.0) | 60.0 (16.9 · 17.4) † · 60.0 (16.8 · 17.0) | 8 · 6 |
| day · UNDER THE HARBOR (floor 162) | 60.0 (17.0 · 17.7) · 60.0 (16.8 · 17.0) | 59.9 (17.0 · 17.6) · 59.9 (16.8 · 17.0) | 60.0 (16.9 · 17.6) · 60.0 (16.8 · 17.0) | 8 · 7–8 |

† in the whole table's run this row read 56.5 fps with ONE 250 ms frame — the build machine's known headless stall (≈ 2 min into a run; the
memory note "Beelink frame-timing quirks"); run alone (`--perf8 --one=day-84-0-1`) it is the 60.0 above. The same stall took one row of
the solo table (`--perf`: 46 rows, 45 green; day · THE SPEAKEASY · tier 1 at 4× = 56.2 fps with one 250 ms frame → alone 60.0, worst
16.9 ms). `--stutter`: 2 / 2 (night: the one 250 ms stall frame at @129, nothing else over 17.4; day: worst 17.3 ms).
- **The tags count ("6 tags")**: 8 names are baked, a tag is drawn while its ball is at least half there AND not next to mine (a ring
  there) — in the held-round-me rig 6–8 of 8 qualify. The first whole run of this table read "0 tags" on every row: the rig lifted the
  ghosts ABOVE my ball, and a ghost above me wears no tag (the review's find 4) — the rig now restores the tag (`stage.js`, `simNear`
  only — the test page's hook, never a real match). The speed was the same with and without (the tags are ONE instanced draw).
- **Zero garbage:** `ghostsFrame`, `matchHudNow`, the ghost layer's `place` + `draw`, `stepGhost` / `stepWatch` are in the static scan of
  the frame functions (`tests/freefall-play.test.mjs`); the rail + the markers write the DOM on a change only.
- **The rules untouched:** floors 0–199 + the 2,000-seed sims' pins did not move (`tests/freefall-*.test.mjs` — the unit suite); REPLAY =
  LIVE holds in a match (the director's rows = the judge's replay of each player's own node; `e2e-freefall-match.mjs` compares them).
- **These are the mini PC's numbers.** A real iPhone was not measured in this pass (OPEN FOR BEN 11).

## THE FINAL RUN (Nov 26, on the mini PC — this pass's OWN emulators + `serve.mjs --emu` on :5173; nothing else busy for the speed tables; the owner's :5190 never touched)
| suite | result |
| --- | --- |
| `node --test tests/*.test.mjs` | **2,823 / 2,823** (the rules' pins, the 2,000-seed sims, the frame functions' garbage scan, the registration + the budget lines among them) |
| `freefall-play.mjs` (the test page, whole) · `--f4b` | **170 / 170** · **17 / 17** |
| `freefall-play.mjs --perf8` (8 ghosts) · `--perf` · `--stutters` | **18 rows: 17 green + the machine's stall row green alone** · **46 rows: 45 + the stall row green alone** · **2 / 2** ("THE MEASURE" above) |
| `freefall-lab.mjs` · `freefall-share.mjs` | **57 / 57** · **266 / 266** |
| `e2e-freefall-match.mjs` (a real 3- + 8-player match, a late joiner, a host change, a lock, a signal drop, a refresh, REMATCH) · `--cap` (+ the 3:00 cap) | **109 / 109** · **125 / 125** |
| `e2e-freefall.mjs` (the hidden cartridge, solo) | **61 / 61** |
| `e2e-smoke.mjs` (THE PAGES LOAD among them) | **28 / 28** |
| `e2e-highrise.mjs --fast` · `e2e-highrise-match.mjs --fast` · `e2e-jaywalk.mjs` FAST=1 (the shared kit: the proof-writer, the report, the share card) | **114 / 114** · **35 / 35** · **122 / 122** |
| the harbor suite, `ONLY=cartridge` (THE LAZY LOGIC · THE CARTRIDGE PLUG · THE FROZEN CONTRACT) | **3 / 3** |
| LAST: `rules.test.mjs` · `server.test.mjs` · `share-card.test.mjs` | **106 / 106** · **78 / 78** · **5 / 5** |

- **The `/api` suite's two FREEFALL cases were red on their first whole run — three faults, all in the TEST's fixtures, none in the code:**
  (1) the match fixture's bots shared ONE ceiling (floor 90) → the two best tied (90 · 90 · 59) where the case wants an order: each bot
  now stops at its own floor and a seed on which a better bot did not end strictly deeper is skipped; (2) a node with a hold in a match
  counts no floor → its player did not PLAY → the report answers 403 `not_in_match` (A SEAT IS NOT A PLAY) — the case expected an
  answer and now takes either; (3) F4A's made-in-advance node was cut at 380 characters and trimmed with a pattern that could leave a
  gap without its move (a broken log: "refused (chunks)" instead of "ahead of the clock") — on some seeds only, so it passed alone and
  failed in the whole run: the trim now ends on a whole entry.
- **The look shots** (80 + the end screen re-shot after the last spacing change): `Downloads\NEON\freefall-f4b\look\` · the share cards:
  `…\share\` · the frame bar before / after: `…\framebar\` · the match's E2E: `…\match-e2e\`. Nothing in the repo.
- **The inbox** (`Downloads\NEON\ADDONS.md`) was read at the start, after each group's commit and before these tests: no entry for this
  pass. Appended at the close: OPEN FOR BEN + three notes for other passes (HIGH RISE's solo GO + its end grace · the proof games' two
  named finds · the city's YOU ROW glow over an end screen's foot).
- **The servers this pass started are stopped** (the emulators' npm / firebase / java + `serve.mjs --emu`, each by its own PID).

## OPEN FOR BEN
1. **Nothing to re-publish** — the rules file did not change. FREEFALL is still hidden, the counting switch is OFF.
2. **Four checks on your iPhone** (all on the hidden test page / your own room):
   - the skylight's frame bar: `/freefall-play?floor=38&look=night` (and `&look=day`) — break floors 39 → 41: no bar may hang in the air;
   - the end screen (the logo, YOUR BEST · AVG, the footer) — play a solo run to its end, night + day;
   - the bot room: `/freefall-play?mode=match&rivals=7` (add `&watch=1` to see WATCH THE LEADER at once) — the ghosts, their name tags, the
     depth rail, the ↓n ↑n markers; then a REAL match with your brother (you host);
   - SHARE on the end screen (the picture) · a pause with a good line, and one with the phone in airplane mode (see 13).
3. **HIGH RISE's live solo GO has the same small hole FREEFALL's had** (the phone can adopt its own clock's guess of the GO before the
   server's answer). Fixed for FREEFALL here; HIGH RISE is live, so I did not touch it — in the inbox for its next pass.
4. **A run that ends INSIDE a dropped-signal burst is taken whole** (every proof game, not new): the last ≤ 8 s arrive late and the judge
   accepts them. Closing it would cost honest players on bad signal their last floors. Your call whether it stays.
5. **Ties for first in a match ≈ 6 % of the sims** (same floor AND the same landing tick → a DRAW, the console's rule). Fine, or a
   tie-break (fewer moves? earlier last input?) — a new rule, so yours.
6. **A match's end screen = JAYWALK's / HIGH RISE's body** (the podium, "16 FLOORS · YOU FINISHED 3RD", YOUR TABLE) under the logo — it
   has NO big number, no YOUR BEST · AVG and no stats line (solo has them all). Want them in a match too? And with the logo the podium is
   ≈ 100 pt taller: at 390 the third row sits on the fold (MORE BELOW shows it).
7. **The share card:** the night card's gold finish frame is mostly white bloom (day is good); THE LIGHTS WENT OUT shows a lit floor
   inside the card's dark; one end has three wordings (MADE IT TO THE BOTTOM · YOU HIT THE BOTTOM · HIT THE BOTTOM) — pick one; "0 BLAZES"
   prints in fire orange (hide a zero?).
8. **The calls I made** (overrule any): the count is 3 s + a 2 s shared lead; the match's judge gives 9 s of grace after the 3:00 cap; a
   rival with no news for 18 s is OUT for the watchers (75 s for the result); WATCH plays 1.5 s behind (up to 5 s on a bad line); a ghost
   above me fades out by two floors up; the tags never fade; SHARE's red frame is taken 200 ms after the hit; the footer is PLAY AGAIN
   (the bar) + SHARE | HOME (two quiet links). The whole list: "THE CALLS MADE" above.
9. **A cold start can miss the count's "3"** (the game's files still loading on a first-ever match) — the phone joins at "2". The GO is
   never missed. A longer count for a first match, or leave it?
10. **A guest who becomes host cannot REMATCH** the hidden game (only your account can start it). Goes away at go-live.
11. **The speed numbers are the mini PC's** — 60 fps with 8 ghosts there; the iPhone 12 / 13 at full 3× needs your eyes (the tier drops
    by itself if it struggles — tell me if you see it drop).
12. **F5's first item is THE WATER SURFACE** (your note) — and the seabed dust's square edges (seen in the look shots).
13. **A phone locked with NO signal now loses the floors after the pause** (the pause was never granted — that is the gap you closed). On
    a real iPhone, check that a normal lock on a GOOD line keeps the run: the pause's chunk must leave before iOS freezes the page. In
    Chromium it does (`e2e-freefall.mjs` 6 b); Safari could not be tested here.
