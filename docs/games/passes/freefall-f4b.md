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
| 1 — THE MATCH | (below) | the rules (`match.js` · `director.js`), the judge of a match (`proof.js#judgeMatch`, the server's `freefallMatch`), THE GHOSTS (`ghosts.js` · `ghost-fx.js`), THE DEPTH RAIL + the edge markers (`matchhud.js`), the stage's match mode + the test page's bot room (`matchsim.js`), the cartridge's match screen (`view.js`) |
| 2 — THE END SCREEN | (below) | THE LOGO header, YOUR BEST · AVG, YOUR TABLE, the universal footer — the test page's card + the cartridge's podium body (solo + match) |
| 3 — THE SHARE CARD + SHARE | (below) | the real end frame, the card, SHARE in the footer |

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
