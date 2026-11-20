# HIGH RISE — S4B: THE END SCREEN · THE LAG CHECK · THE MATCH · THE RULE-SET TABLE (Nov 19–20 2026)

**RULES CHANGED — RE-PUBLISH `Downloads\NEON\database.rules.nov20-s4b.json`** (see OPEN FOR BEN 1). HIGH RISE stays HIDDEN (the
owner's phone only) and NOTHING COUNTS (`HIGHRISE_COUNTS` off). The owner's decisions: `docs/games/plan.md` "HIGH RISE — S4B".
The bible: `docs/highrise.md` "THE END SCREEN" · "THE LAG CHECK" · "THE MATCH" · "THE RULE-SET TABLE" · "THE LIVE LOCK".

| commit | what |
| --- | --- |
| `bc31f870` | Step 0 — the decisions into plan.md; the Lab's marks re-exported (no open FIX mark) |
| `31fcde79` | Group 0 — THE END SCREEN = JAYWALK's standard |
| `9ad9b8e2` | Group 1 — THE LAG CHECK |
| `aef32d95` | Group 2 — THE MATCH |
| `8de306a5` | Group 3 — THE RULE-SET TABLE + THE SMALL FIXES (the rules change) |
| the close | the fresh-eyes review's fixes, the docs, the final run |

THE ADD-ON INBOX: read at the start, after every group's commit and before the final run. Built: the Nov 19 6:22 pm + 6:35 pm
END SCREEN entries (Group 0 — marked done). The Nov 19 6:55 pm entry is addressed to the next CITY pass (left open, untouched).
Read once more before the final run: nothing new. Added at the close (Nov 20 ~12:49 am): OPEN FOR BEN · TO JAYWALK + HIGH RISE —
NEXT PASS (the leaf writes · the refresh mid-match · the calls · the silent phone) · TO HIGH RISE — THE REVIEW (garbage in a match).

## GROUP 0 — THE END SCREEN (JAYWALK's standard)
ONE builder (`endscreen.js#endCard`) for the test page's card and the cartridge's body — the mockup
`Downloads\NEON\highrise-end-jaywalk-style-v2.png`:
- the header `HIGH RISE · SOLO` / `· MATCH` (HIGH hot pink, RISE cyan, the mode lavender — the console frame's kicker in the cartridge);
- the cause in saturated hot-pink neon (MADE IT TO THE MOTHERSHIP gold); the floor huge + white with a cyan glow; `FLOORS`;
- `YOUR BEST · n` gold (`NEW BEST · WAS n` when beaten); one line `n PERFECTS · BEST STREAK n`; YOUR TABLE right under it;
- the universal footer PLAY AGAIN · CITY; JAYWALK's veil over the scene (night + day).
Gone: design A's stats strip, the dashed gold outline, `BEST n ↑`. `WOULD COUNT` stays one small line over the bar; REPLAY = LIVE,
the test page's note + the trace panel keep their places.

**Shots** (`Downloads\NEON\highrise-s4b\end\`): `page-{night,day}-390x844-{miss,thin,slow,cap,newbest,made}.png` ·
`cartridge-{night,day}-390x844-{tooslow,table-0,table-1,table-3,table-8}.png` (YOUR TABLE with real fixtures: 0 · 1 · 3 · 8 friends) ·
`side-by-side-jaywalk-vs-highrise.png`.

## GROUP 1 — THE LAG CHECK
| what | before | after |
| --- | --- | --- |
| uploaded before the first tap | the current band's plate + the next | the look's FIVE plates + its reflection map, every flyer's module + model (kept), the programs |
| set-up after START (`?trace=1`: programs / uploads / decodes) | at each new band + each flyer's first moment | **none** — floor 1 → 120, and floor 80 by day |
| layouts / paints BETWEEN landings (solo) | a layout + two paints 0.7–1.9 s after every call | **0** |
| a landing | — | ≈ 1.8 layouts / 3.6 paints |
| ZERO GARBAGE (the game's own objects a second; the line is 12 KB/s) | 4.2 KB/s | 4.2–4.4 KB/s |

- **THE PRE-WARM**: behind the welcome screen; START waits ≤ 0.6 s for it. The trace panel's new line: `SET-UP AFTER START: none`.
- **`?lean=1`** (the test page): every DOM / CSS effect over the 3D view off while a run is live; the panel + the note say LEAN.
- **The repaint audit** (`highrise-paint.mjs`, a Chromium trace): the one find — the announcer's end put its class + opacity back on
  an invisible line (a layout + two paints after EVERY call) — fixed; the match clock keeps one text node.
- **`?floor=N`** counts toward nothing (the announcer, the chime, the end card's perfects + best streak, YOUR BEST).
**Shots**: `Downloads\NEON\highrise-s4b\lag\`.

## GROUP 2 — THE MATCH (2 … 8 players; JAYWALK's match is the pattern)
- **The rules** (pure — `match.js` · `director.js`): count 3 · 2 · 1 → play → final. Every phone writes its own GO (a transaction,
  never applied locally); THE FIRST GO picks the seed + tick 0; each player their own `hr` proof node. The end: every tower ended (a
  dead phone: 12 s online, + the dropped signal's 75 s offline) or the 6:00 cap + 4 s. The rows = THE JUDGE's replay: the floor, then
  the most perfects, then the earlier tick. UNPROVEN with no GO in 3 s.
- **THE RIVALS** (`rivals.js`, pure): a rival's tower = their LANDED taps through the same engine, never a tap assumed.
  **THE HEIGHT TAPES** (a rival under you = a thin tape round your tower in their colour — never the top slab, never in the bloom
  pass) · **THE TAGS** (at / over you = a right-edge tag `ALEX ▲3`, the 3 nearest, merged when they would overlap, dim while a slab
  slides) · **THE ALTIMETER** (every player, a slim strip at the left edge).
- **THE PIXEL TEST** (`highrise-rivals.mjs`): 8 players, 48 frozen samples day + night at 390 × 844 → **0 rival pixels in the play
  zone**. Its one find: a rival one tap behind flashed a tape under the top slab → a rival one floor under you still climbing is LEVEL.
- **The screen**: the kit's announcer (passes merged: `3 PASSED YOU` · who is out · MADE IT); OUT = the cause's words → Call the Winner
  → WATCH (the leader first, a tap = the next, a tap on the altimeter = that player); the finish at floor 200, TIME'S UP at the cap;
  the podium `HIGH RISE · MATCH` (every row its floor + cause + perfects; your place + your call); REMATCH in place; a late joiner
  watches until the next REMATCH; each phone its own look.
- **The server**: `highriseMatch` judged behind THE SWITCH — WOULD COUNT for every player, nothing written.
- **The test page**: `?mode=match&rivals=N` (bot rivals on the same seed; nothing counts).
- **Rock solid — each tested** (`e2e-highrise-match.mjs`): the same seed on every phone · a refresh mid-run + after out · an app
  switch · a signal drop · the rematch · the host's phone dying (the next phone carries the match on from the database).
**Shots**: `Downloads\NEON\highrise-s4b\match\` (`match-*.png`, `rivals-*.png`).

## GROUP 3 — THE RULE-SET TABLE + THE SMALL FIXES
- **THE TABLE** (`rules.js`): every rule number in ONE row a rule set; today's only row `classic`. `tuning.js` names that row; the
  engine + the judge read the run's own row. Every run records its rule set (`run.rules` → the result → the proof node's `rs`); the
  judge refuses a set it does not know; a match = ONE rule set (THE FIRST GO's).
- **IDENTICAL RESULTS, PROVEN**: the digests of 720 bot runs (`9746d6b1`) + the whole event stream of 36 (`d1dc2c63`) were taken on
  the untouched engine BEFORE the table; after it they are the same (`tests/highrise-rules.test.mjs`).
- **THE RULES GAP (jw + hr) — THE LIVE LOCK**: the old rule refused a delete of the live tree by reading game/phase — which the host
  writes. Now ONE match's tree goes only once the host's OWN GO in it is 10 min old (whatever `game` says); a tree with no GO of his
  never; the WHOLE node never. `host.js#pruneProofs` + `kit/again.js` ask only for what the rules allow (a held tree waits for a
  later start). Nothing honest breaks: rules tests for both games (every way to dress the flip · the withheld GO · 9 min held /
  11 min gone · MAKE HOST), JAYWALK's two E2Es green.
- **"+0 XP" — CONFIRMED THE DAILY CAP, not a bug**: THE SOLO LANE pays a streak day's first 4 solo runs — EVERY solo game's (four
  JAYWALK runs use them up; with counting off HIGH RISE's own runs never use one). The line now reads
  `WOULD COUNT · FLOOR 85 · +0 XP · DAILY CAP` (a room match past THE DAILY CEILING too).

## THE CALLS MADE (obvious / established pattern — the owner may overrule: OPEN FOR BEN 3)
1. SHARE is absent from the end screen's footer until THE REVIEW builds the share image (the decision); the footer is PLAY AGAIN · CITY.
2. The floor number is ≈ 100 px at 390 (the mockup) — JAYWALK's is 92.
3. No YOUR BEST gold line on a MATCH's end (it shows your place + your call instead). A match's floor never SETS YOUR BEST either (the solo best — the review).
4. The pre-warm warms the look ON SCREEN (the other look's plates come at a look switch); both jets always; the models are kept.
5. The announcer calls passes (merged), who is out, MADE IT — a rival's STREAKS are not called (everyone climbs in step: it was 7
   calls every 10 floors).
6. Tapes = the 3 nearest under you; tags = the 3 nearest at / over you; a rival one floor under you still climbing = LEVEL.
7. The altimeter is an ordered strip at the left edge; the OUT card's kickers: OUT / THE FINISH LINE / THE BELL.
8. A silent phone is out after 12 s (online) / + 75 s (offline); an unproven match ends after 90 s. A tower still climbing 3 s after the
   match ended gets the podium (the review).
9. If the OWNER's phone loses its line ≥ 10 s the host moves to a guest who can not start the hidden game — REMATCH then needs MAKE
   HOST. By design until go-live.
10. THE LIVE LOCK = 10 min, keyed on the host's own GO: a tree the host never played in (he joined late / became host later) stays
    until the room closes; an endless SOLO run longer than 10 min is outside the lock (self-harm only).
11. A match's rule set = THE FIRST GO's player's; a proof node with no `rs` = classic. A set nobody knows is never the match's
    (the review); `rs` only before the log's first chunk.
12. `?lean=1`'s announcer lane hides itself; night.js's dashed-ghost code is left in place, unused.

## THE FRESH-EYES REVIEW (the close — two separate agents that wrote none of it; read-only)
The first reviewer (the whole diff in one brief) came back EMPTY; it was run again as two narrower ones — the rules / proof / server
side and the screen side. Every finding was checked against the code before anything was changed.

**FIXED (9)**
| # | what the review found | the fix |
| --- | --- | --- |
| 1 | `proof.js#matchRules` took THE FIRST GO's player's `rs` as written — a modified phone that GOes first could name a set nobody knows (`zz`) and void EVERY tower in the match (a draw at will; host's podium + server alike) | a set nobody knows is never the match's: the match stays `classic`, that player's own node is the one refused |
| 2 | two GOs in the same millisecond: the match's rule set depended on the order the keys came in (host and server could disagree) | the lowest uid's |
| 3 | the `rs` rule let the rule set be written any time before the end (even in one write with it) | the rules: only BEFORE the log's first chunk, never in one write with a chunk or the end (`newData.parent()`); the phone no longer asks once its log has begun. **A RULES CHANGE — in the saved file** |
| 4 | a REFRESH mid-match could take the match from the game alone before the proof mirror had loaded: no taps of its own → floor 0, TOO SLOW on that phone, no `e` written (the podium itself stayed right) | `view.js#pumpMatch` adopts in `play` only once the nodes are here (or the match is UNPROVEN) |
| 5 | the podium waited for this phone's own end with NO bound — a tower still climbing after the host ended the match (its chunks had not arrived) climbed a dead match to the 6:00 cap | the podium after `FINAL_HOLD_MS` (3 s) |
| 6 | the lost-WebGL stand-in view had no `setRival` / `dimRivals` / `showRivals`: PLAY AGAIN threw with the context down — solo too | the three handles |
| 7 | a MATCH's floor was stored as YOUR BEST (the solo best): the next solo run showed its gold line against a match height | a match never sets it |
| 8 | the cartridge's podium said NEW BEST on a first-ever run (the stage's own card: YOUR BEST · n) | NEW BEST only of a best that was beaten — one rule for both |
| 9 | the altimeter re-appended every row at an order change — under a finger while watching (a lost tap); + a phone whose GO was refused 8 times showed a normal OUT cause | the order waits while a row is pressed (≤ 1.5 s); OUT says NOT COUNTED with no GO |

**NOT FIXED — named, and why**
- **THE LEAF WRITES (HIGH — `jw` + `hr`, older than this pass):** THE LIVE LOCK stops the host deleting a live tree; a modified host
  can still make a rival's chunk write FAIL for a moment (every leaf rule reads host-written `game/*`), which leaves a hole → the
  judge refuses that run. Before this pass he could simply delete the tree, so nothing got worse — but the gap this pass set out to
  close is only half closed. The fix (the leaves gated on the player's own `go` + a time bound, the phone re-sending a refused chunk
  in order) changes live JAYWALK's rules and its proof writer: a group of its own, with its own rules tests — not a close-of-pass
  patch. → the inbox, OPEN FOR BEN 4, docs/highrise.md "THE LIVE LOCK".
- **A silent phone that still reads as ONLINE is out after 12 s** (a dropped signal the database has not noticed yet — its queued
  taps then arrive after the end). This is JAYWALK's live rule, number for number (18 s there); longer = everyone waits longer for
  a dead phone. An owner's number → OPEN FOR BEN 3.
- **Call the Winner counts a player with no tower as "still in"** — only matters when EVERYONE ends at floor 0. JAYWALK's line is
  the same; left for one shared fix.
- **GARBAGE IN A LIVE MATCH** (the zero-garbage guard measured SOLO only): the match's HUD + the rivals' placing allocate on every
  landing, the room's mirror re-reads the match's whole proof tree at every rival's chunk, the pump runs 10 × a second. Measured on
  the test page with 7 bot rivals at the close (THE FINAL RUN); the mirror's share needs a real match on a phone → THE REVIEW.
- **JAYWALK's view has finding 4's pattern too** (its own adopt before the mirror) → the inbox, to the next JAYWALK pass.

## THE FINAL RUN (the Beelink — fresh emulators + this pass's own `serve.mjs --emu`, nothing else busy)
| suite | result |
| --- | --- |
| unit — `node --test tests/*.test.mjs` | 2363 / 2363 |
| rules — `rules.test.mjs` | 89 / 89 |
| `/api` — `server.test.mjs` | 68 / 68 |
| smoke — `e2e-smoke.mjs` | 26 / 26 |
| `e2e-highrise.mjs` (the full run — THE HITCH RUN inside the cartridge too) | 82 / 82 |
| `e2e-highrise-match.mjs` (three phones + a late joiner, the rock-solid part) | 55 / 55, errors none |
| `e2e-jaywalk.mjs` · `e2e-jaywalk-match.mjs` (FAST) | 99 / 99 · 91 / 91 — run BEFORE the review's fixes; none of them touches JAYWALK or the `jw` rules |
| the test page — `highrise-play.mjs` · `--s3` · `--end` · `--webkit` | 237 / 237 (REPLAY = LIVE ✓) · 125 / 125 · 52 / 52 · 6 / 6 |
| THE PRE-WARM `highrise-prewarm.mjs` · WHAT REPAINTS `highrise-paint.mjs` | 35 / 35 · 13 / 13 |
| THE PIXEL TEST `highrise-rivals.mjs` (8 players, day + night) | 10 / 10 — 0 rival pixels in the play zone |
| ZERO GARBAGE `highrise-alloc.mjs` (solo) | 8 / 8 — the game's own code 4.4 KB / s (≤ 12) |
| the flyers' path `highrise-flypath.mjs` · the landing · the lab · the sound sync | 26 / 26 · 7 / 7 · 45 / 45 · 42 / 42 |

**What the final run itself caught (fixed before the push):**
- **A match laid out + painted at every landing with NO rival on screen** (`highrise-paint.mjs`'s match row had last run before the
  match's HUD existed): the dim while a slab slides was a class on the tags' full-stage box. Now on the tags themselves (compositor
  layers; a tag not shown is not written): a landing 4.9 → 3.0 layouts · 13.7 → 6.0 paints; between landings 70 · 184 → 25 · 50 (the
  clock's one write a second). `--table` now names when the between-landing writes fall.
- three CHECKS that were behind the code: the lab's request list (+ `rules.js`, Group 3's file), the test page's match card (no YOUR
  BEST line — fix 7), and the hitch check's excuse for headless Chromium's own ~0.65 s stall (keyed on the mark's name; it is now the
  frame's size against the page's OWN measured work in it — 633 ms, work 0 ms).

**Measured, NOT fixed — GARBAGE IN A LIVE MATCH** (`ALLOC_Q='&mode=match&rivals=7' node highrise-alloc.mjs <chromium> --table`, the
test page, 7 bot rivals, 60 s): the game's own code makes 41 KB of objects a second — 21 of them are the test page's own bots
(`matchsim.js`, never in the cartridge), **≈ 13–15 KB / s are the match's HUD + rival helpers** (`matchhud.js#altimeter` 4.1 ·
`rivals.js#mergeTags` 2.8 · `matchCalls` 2.3 · `nearest` 1.9 · `stage.js#placeRivals` 0.8), against 4.4 in a solo run and the guard's
12. ZERO GARBAGE IN PLAY therefore holds for SOLO only; the room's mirror of the proof tree (the cartridge) is not in this number.
Making those four helpers scratch-based + a match row in the guard is a group of its own → the inbox (THE REVIEW).

**The servers:** every server this pass started is STOPPED (the emulators' npm / firebase / java + `serve.mjs` on :5173, by PID).

## OPEN FOR BEN
**1 · RE-PUBLISH (do this FIRST — the match needs it):** paste `C:\Users\benja\Downloads\NEON\database.rules.nov20-s4b.json` into the
Firebase console → Realtime Database → Rules → Publish. What changed: THE LIVE LOCK on the `jw` + `hr` proof trees (the host deletes
one match's tree only once his own GO in it is 10 min old; the whole node never) + HIGH RISE's proof node `hr` with S4B's `rs` (the
run's rule set: once, behind GO, before the log's first chunk). It also carries what was still pending (S4A's `hr` node, DAILY A's
JAYWALK daily node). Publish any time AFTER this deploy is live (an old build's prune would be refused once — harmless, but it shows
as a row in /admin's errors). Until it is published a HIGH RISE run in the cartridge plays UNPROVEN: no WOULD COUNT line, and in a
match no rival towers.

**2 · YOUR PHONE CHECKS**
- THE END SCREEN: https://neonspeakeasy.com/highrise-play — play to the end (miss · too thin · too slow), then beat your best
  (NEW BEST · WAS n). Compare with the mockup + JAYWALK's end.
- THE LAG A/B (compare the "> 33 MS" counts on the two end cards, the same kind of run on each):
  https://neonspeakeasy.com/highrise-play?trace=1&fps=1
  https://neonspeakeasy.com/highrise-play?trace=1&fps=1&lean=1
  The panel should also say `SET-UP AFTER START: none`. If lean is clearly better, the DOM effects are the cost; if the two are the
  same, the stalls are not the page's.
- A MATCH with your brother (after the re-publish): https://neonspeakeasy.com → open a room → he joins → pick HIGH RISE (only your
  phone can start it) → START. Check: the 3 · 2 · 1 count; the SAME tower on both phones; his height as a tape on your tower when
  he is under you / a tag at the right edge when he is over you; the altimeter at the left; no rival ever over the sliding slab;
  OUT → Call the Winner → WATCH; the podium `HIGH RISE · MATCH`; the small line `WOULD COUNT · …`; REMATCH. Then the rough ones:
  refresh mid-run, switch apps for a few seconds, walk out of Wi-Fi. **Does a match feel as smooth as a solo run?** (see 4.)
- The bots on the test page (no brother needed): https://neonspeakeasy.com/highrise-play?mode=match&rivals=7

**3 · THE CALLS I MADE — overrule any** (the list above, "THE CALLS MADE"). The ones most worth your eye:
- SHARE is not in the footer until THE REVIEW builds the share image.
- A rival's streaks are NOT announced (only passes, who is out, MADE IT).
- YOUR BEST is the SOLO best: a match's floor never sets it. A first-ever run shows YOUR BEST · n — NEW BEST only when a best was beaten.
- A phone that goes silent but still reads as online is out after 12 s (JAYWALK: 18 s) — a signal the database has not yet noticed
  dropping loses its queued taps. Longer = everyone waits longer for a dead phone. Your number.
- A tower still climbing 3 s after the match ended (its taps never arrived) gets the podium.
- If YOUR phone drops for 10 s in a match, the host moves to your brother's phone, which can not start the hidden game — REMATCH then
  needs MAKE HOST back to you. (Goes away at go-live.)
- THE LIVE LOCK is 10 minutes; a proof tree the host never played in stays until the room closes.
- "+0 XP" was the daily cap: the line now says `+0 XP · DAILY CAP`.

**4 · NOT DONE / STILL OPEN — read these**
- **THE RULES GAP IS ONLY HALF CLOSED (JAYWALK is live):** a cheating HOST can no longer DELETE a live proof tree — but on a modified
  phone he can still make a rival's taps fail to save for a moment, which voids that rival's run (the review's find; older than this
  pass, and before it he could simply delete the tree). The real fix changes live JAYWALK's rules + its proof writer: it needs its
  own group. In the inbox, to the next JAYWALK / HIGH RISE pass.
- **ZERO GARBAGE holds for SOLO only:** a match's HUD makes ≈ 13–15 KB of objects a second with 7 rivals (solo 4.4; the guard 12).
  Not fixed in this pass. If a match stutters on your phone where a solo run does not, this is the first suspect → THE REVIEW.
- The share image + SHARE on the end screen (THE REVIEW's, by your decision).
- The inbox's Nov 19 6:55 pm entry (every game's end screen in coloured neon + the pink flash everywhere) is addressed to the next
  CITY pass — untouched.
