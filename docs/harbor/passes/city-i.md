# CITY I — HOUSEKEEPING (HOW TO PLAY out of the boot, the CLAUDE.md trim, SECOND ACCOUNTS + DON'T COUNT, the Chromebook's double close) — Nov 18 2026, the mini PC

After CITY H2. **Step 0** — read CLAUDE.md, decisions.md, harbor.md, progression.md, profiles.md, city-h2.md. THE LAB: `lab-export.mjs <live>` → 224
marks, **no open FIX**. THE INBOX at the start: nothing open for CITY I; three arrived during the pass (6:50 · 7:55 PRIORITY · 8:05 pm) — the PRIORITY
built as the next group, the other two as the last group before the final tests. Own servers: fresh emulators + `serve.mjs --emu` (:5173), restarted
fresh for the final run. **THE BOOT at the start: room 14,161 B + 3 modules** (H2's close).

## Group 0 — H2's cloud run + the two pre-existing reds
- **H2's cloud run (ca29a6ec, harbor):** tests ✓; harbor ✗ in four jobs. Each found + fixed (or named):
  - `lobbyfix2 · platefit` "THE PLATE COVERS ITS WIDEST LINE" (7 strips) — since JAYWALK POLISH a slim name that can't fit is cut to an ellipsis
    (`.fit-cut`); the check measured the whole TEXT. It now measures a cut name by its own box (12 / 12).
  - `room2 · afterparty` "REMATCH sits INSIDE the ring" (48 pt in 47) — H1's RE / MATCH lines carried their last letter's tracking + the one-line
    label's 0.16em left balance pushed them 1 pt right. Trailing tracking cancelled, 0.1 → 0.08em, the balance off in the rematch → 46 pt, 0.4 | 0.4 pt
    of air, centred (17 / 17).
  - `lobbyfix · hostcard` "THE DOCK's LABELS GET AIR … 390: 0 labels" — the slow runner's dock still re-laying out after the viewport change; the
    helper now waits for the 7 labels (a condition, never a sleep).
  - `perf` MEMORY 32.5 MB (limit 6) — **not reproduced** on this code here (3.5 MB) — named as the cloud's.
- **e2e-profiles' CIPHER podium hang — THE FROZEN-GAME HANG (a real app bug):** `app.js#wantGame` re-rendered on `loadGame`'s INSTANT `null` for a
  FROZEN id → render → wantGame → null → … a microtask loop that never yielded: any phone in a room playing a frozen game froze. Now the id is
  remembered + the phone goes to the city ONCE (NEVER A DEAD SCREEN, counted 'dead'); e2e-playnow's new `frozenroom` case (the page answers, the city
  in ~0.3 s — WebKit). The test's match moved off CIPHER (frozen, never loads) onto OVERCLOCK (each player's own proof node — A SEAT IS NOT A PLAY),
  and its stale checks onto today's screens (the podium's slim cards, BOB's XP box after his plaque, CITY F's held item beats, CITY C's KNOCK slot, THE
  YOU ROW on the strip, the player page's MORE, BOB's own board row, relative match counts, settle-before-click).
- **THE LOST SEAT LINK (its "room seats carry the profile id", ~1 run in 2):** a profile that linked while the join was in flight never got its pid
  on the seat (the rules want `seats/{pid}` first). `room.js#updateMyProfile` takes the free seat + arms the seat watch; the players listener heals our
  own pid-less node once a room; `profile/me.js#linkRoomSeat` waits for the seat. **e2e-profiles 148 / 148** (THE BOARD's layout B checks run + pass).
- **strip-match `--still`: the 13** — measured, NOT changed, named in docs/vault.md "THE STRIP MATCH's 13" (9 CSS-art cards whose effect adds a layer —
  the `o` still would change every list's look → OPEN FOR BEN; 4 baked stills re-baked byte-identical, the live framing gap not pinned).

## Group 1 — HOW TO PLAY OUT OF THE BOOT
`js/ui/help.js` (28.4 KB) = a LAZY chunk behind `js/ui/help-open.js` (THE SKEW WRAPPER; the frame at the tap + LOADING, the rules fill that sheet, a
second tap opens nothing more, TAP TO RETRY + reported); warmed 3 s of visible time after the reveal (idle). title.js's import was unused — dropped.
`tests/help-lazy.test.mjs`; harbor lobbyfix `helpcold` 8 / 8. **+24,516 B of room** (one module out, one in). docs/harbor.md "HOW TO PLAY OUT OF THE BOOT".

## The inbox's 7:55 pm PRIORITY — MUSIC OFF = PODCAST MODE (the owner's option 3)
docs/audio.md "CITY I". Effects only (no bed, no city loop / ambience one-off, no station element — music.js rests through `engine.js#onPodcast`); every
source counted, 150 ms after the last one the master's VALUE → 0, the zeros, then a REAL suspend (never pretending); an effect wakes it (a tap's in its
gesture; a pointerup effect by its touchend; one no tap follows dropped after 300 ms); the first tap after a music-off load resumes it in the gesture;
/admin AUDIO LEAVE opens with "ctx at the leave: SUSPENDED / RUNNING". **Proved in Chromium** (Playwright's WebKit on Windows has no Web Audio):
audio-leave 28 / 28, audio-hush 9 / 9, audio-session unit, harbor mediacut.

## Group 2 — THE CLAUDE.md TRIM
40,917 → 31.5 KB (32,728 B at the close with this pass's two lines). Moved WORD FOR WORD under "THE RULES FROM CLAUDE.md (moved Nov 18 — CITY I …)":
JAYWALK's 12 · OVERCLOCK · PRISM + SKINS + THE DROP · HOLD'EM · the dailies' 10 · the city's 21 module rules · the audio LEAVING line · ITEM NAMES +
THE ADD-ME LINK · THE LIVE LANE + THE STRIP MATCH. `claude-md-coverage.mjs`: 0 missing vs the diet's baseline AND vs HEAD.

## Group 3 — SECOND ACCOUNTS + DON'T COUNT
docs/profiles.md "CITY I — SECOND ACCOUNTS + DON'T COUNT". `seen/{h}/{pid}` (HMAC of the address, a salt derived from the pepper, 14 days, LIVE);
/admin → SECOND ACCOUNTS (groups via any shared address; username, first / last seen, plays; NOT COUNTED + UNDO); `nocount/{pid}` (DURABLE, the root
rule denies clients — **no rules change**) applied AT READ: THE BOARD's top + ranks, SCORES + N, the place line + N, THE PENTHOUSE. daily-module
"DON'T COUNT" (1ST OF 2 for the real player, the flagged one still 1ST OF 3, UNDO → 2ND OF 3) + "SECOND ACCOUNTS"; tests/seen.test.mjs.

## Group 4 — THE CHROMEBOOK's DOUBLE ROOM-CLOSE
Re-checked at 4× CPU (`e2e-close-twice.mjs`): on G's code no RULES REFUSED reached /admin, but one phone asking twice still SENT a second close (refused
by the hush rule, quieted after the fact). Now THE CLOSE IS IDEMPOTENT: one close of a word at a time on a device, a word closed here in 10 min = a
no-op, another phone's win = an expected refusal (quiet). 6 / 6, the second close never writes. G's Chromebook trade untouched.

## The inbox's last group (6:50 pm + 8:05 pm)
- **THE LATE PROOF CHUNK (JAYWALK):** docs/jaywalk.md "THE LATE PROOF CHUNK" — no chunk / `e` once the match left 'play' (dropped + counted
  'late-proof'), a refusal in flight after the end = expected (re-checked after the settle), a rejoin's first write reads the chunks fresh. **A refused
  late chunk costs only its own hops — the run counts to its last LANDED hop.** e2e-jaywalk-match 8d → **91 / 91**. No rules change.
- **THE BOARD's controls row** in the CARD COLUMN (the row = the cards' edges, 76 → 359 at 375; every picker label whole — TOURNAMENT WINS 165 px;
  6 full cards at 375 × 667, 7 at 390 × 844).
- **STATS → THE WEEK** = seven horizontal rows (two refine passes — the detail on one line); LEGENDARIES SPOTTED one line when all 0. **THE DATA:**
  visits = distinct anonymous browsers with the city on screen that day (the ~5-min hello) — tests / previews / reloads can't add; a jump = new
  browsers (shared links, Safari + the home-screen app + a 2nd phone apart, a JS crawler). LEGENDARIES SPOTTED IS wired (+1 per COUNTED sighting).

## Named calls
- e2e-profiles' match = OVERCLOCK (CIPHER is frozen — the prompt's own option).
- A DON'T COUNT account's OWN views count itself (its place line, its pinned board row) — "sees no change of its own"; the percentile "TOP X%" (a
  histogram, never a place) + YOUR TABLE (friends only) are not filtered.
- SECOND ACCOUNTS: an IPv6 address is grouped by its /64; the window 14 days.
- PODCAST MODE: the city's ambience one-offs are off in music-off (H1's call, kept — they kept the context awake); a TAPPED city sound plays.
- THE LATE PROOF CHUNK covers SOLO runs too (the same `jw` nodes).

## FINAL
Fresh emulators + `serve.mjs --emu` (:5173). **Unit 2,256 / 2,256** · **e2e-profiles 148 / 148** · **smoke 21 / 21** · the harbor groups `helpcold, platefit,
hostcard, afterparty, mediacut, music, sounds, shell, leaveroom, room, newstart, oneseat, perf` **253 / 253** · **rules 86 / 86** · **/api server.test
66 / 66** · **daily-module 24 / 24** · audio-leave **28 / 28** · audio-hush 9 / 9 · e2e-close-twice **6 / 6** · e2e-jaywalk-match **91 / 91** (an earlier
run: STACKED TAGS MERGE timing — green in the next two) · e2e-playnow `--only quit` (WebKit) **5 / 5** · strip-match `--still` **13 over** (named — docs/vault.md).
NOT run here: e2e-daily (the DAILY_TEST server) — the daily API's changes are covered by daily-module; the FULL e2e-harbor runs in the cloud on the push.
**THE BOOT: 14,161 → 27,517 B of room, 3 modules** (help.js out, help-open.js in); boot-budget.json NOT lowered. No rules change — nothing to re-publish.
Shots: `Downloads/NEON/city-i/` (board-ctrl-375x667 · 390x844 · 1440x900; stats-week-390x844 · 375x667 · 1440x900).

## OPEN FOR BEN
- RE-PUBLISH: nothing (no rules change — `seen` + `nocount` are server-only under the root deny).
- **Phone check — PODCAST MODE:** music off, play a podcast, use the site, switch apps from the home-screen app a few times: no squeal, the podcast
  keeps playing, effects play. The AUDIO LEAVE row should now open "ctx at the leave: SUSPENDED".
- **THE STRIP MATCH's 9 CSS-art cards** (aurora, frostbite, marquee, sg-btc, neonglass, century, smoke, glitter, dev-switchboard): pre-show their effect's
  layer in lists (a transparent still over the card's own picture — the goldenhour gift's way, so the live effect no longer "pops" a layer in), or keep
  them as approved? It changes how they look in every list.
- Named calls above (DON'T COUNT's own views unchanged, the /64 + 14 days, PODCAST MODE's city one-offs off, the late-proof guard on solo too).
