# PFIX-3 — PRISM DROP: FABLE REVIEW 2's FIXES — Nov 14 2026

The plan: docs/games/plan.md "PFIX-3" (Step 0, `a96657a3` — Ben's calls: S9 yes · N6 bottom-aligned · S13 keyed to the song · S11 built
before the tap; C1 fixed HERE). The source: docs/games/review-prism-2.md (its "WHAT BECAME OF EACH FINDING" list is this pass's). On the
mini PC. **No database rules change.** `/api` changed (`api/daily.js`, `api/_lib/drop.js`, `api/_lib/dailies.js`, `api/log.js`).
The reference: docs/prism.md "PFIX-3 — THE DROP's PAUSE + CHUNK RULES" + "PFIX-3 — THE SKINS + SOUND" · docs/progression.md "PFIX-3: THE
REFUSED FINISH + THE SHARE CARDS" · docs/title.md "A SCREEN ON TOP OF THE CITY" (inCity).

**THE DROP — SAFE TO GO LIVE: YES** (M1, M2, M3 fixed and proven in the real app; nothing in the scoring or the cheat checks was touched
except to make them stricter — the chunk store).

## Group A — THE DROP: NO HONEST RUN LOST (`fe48ce19`) — M1, M2, M3, S1, S2
- **The server** (`drop-judge.js`, pure): a chunk is IN STEP at the checked length, or when it starts before it and reaches it (only its
  tail is new) — so two uploads from one offset (M2 order A, S2) are plain accepted uploads; a `ppause` / `pause` whose chunk is out of step
  STILL pauses (`resync: true` + the pause's clock); a player pause is stamped at its chunk's tick (RESUME never fast-forwards); a `ppause`
  that would end the run `late` while a pause is left = a backdated pause, one of the 3, inside the 20 minutes (M3).
- **The chunk store** (`api/daily.js` + `api/_lib/drop.js#stash`): the record is READ FIRST; stored only for a run in flight when the
  judge would take the chunk (`storable`); key `{offset}_{length}`; `joinChunks` reads both key forms; a chunk that was not stored is
  marked `ns` → resync. One more database wait per upload that carries a chunk (~20 a run).
- **The phone** (`drop/view.js`): `pause()` waits for the upload in flight; no answer / no `pa` is never "paused" (frozen + unconfirmed,
  asked again by the return, `online`, the RESUME tap); RESUME only on a confirmed pause; `stop()` sends no checkpoint behind a room pause.
- **A DEVIATION from the brief, on purpose:** "the hide waits for the upload in flight" — the hide's pause goes AT ONCE with keepalive
  instead (a page going away may never get to send a second request); the server's new rules make both arrival orders safe, and the test
  the brief asked for (`send(); hide` → paused, 27 s away, the run goes on) passes.
- **Beyond the brief:** every player pause is backdated to its chunk's tick, not only the late one — the board resumes exactly where it
  froze (it used to jump by the call's latency).

## Group A2 — C1, THE CITY's DEAD EDGES (`8ed112f8`)
`ui/layers.js#touchInCity` (the root · its ancestors · the scene's wrap), asked by `title-taps.js#covered`. `e2e-daily` + 15 checks with
REAL input on points beside the column.
- **A FINDING about the review:** on a REAL phone held sideways the console's TURN YOUR PHONE UPRIGHT card (index.html `#ns-turn`, Ben's
  Nov 2 rule) covers the whole screen — the door is not tappable there BY DESIGN, and since SKINS 2B the card rightly owns the touch
  (before it a tap went through the card and opened JOIN behind it). The review drove the title preview, which has no such card. So the
  brief's "844 × 390 sideways touch: the door → JOIN" is tested where the city IS reachable sideways: 844 × 390 with a mouse (a short
  wide window) and the title preview held sideways (touch) — plus a case that the turn card stays silent. Left open for Ben: nothing to
  decide unless he wants the city playable sideways (the sideways camera / TV mode).

## Group B — THE DROP: THE EDGES (`e78d6e83`) — S3, S4, S5, S6, N4
The refused finish scored at its last provable point + marked + reported + said (`rescueFinish`, `rescue`, `logServer`, `UNCHECKED`); a
run that comes back already ended calls its finish; `clockOffset`; the finish retries with no limit, woken by `online` / the page
showing (`too_early` at the end is retried, not final); `GRAVITY_MS`; `dayCounters`.

## Group C — THE SHARE CARDS (`4f4735da`) — S7, S8, S9, S10, S11, N6, N7 (two)
The lamps on their ink + the column cap · the day doors + labels (6.06 / 5.65 : 1) · `spacedText` for every tracked line · THE DROP's
own card on the kit's rule · bottom-aligned grids + the header's breath · `prepShare` / `endShare` / `prepToday` / `prepDrop` + the YOUR
CARD sheet · the flame by day · the bare domain.
- **share-same's expected copies re-taken ON PURPOSE:** `tests/integration/_old/pw-share.js` (the day doors + labels, the bottom-aligned
  strip) and `_old/cc-share.js` (the lamps). THE DROP has no frozen copy (its card is checked against SHARE TODAY-with-one + the new rows).
- **Looked at, at real size** (1080 × 1350, night + day): SHARE TODAY with 1 / 2 / 3, each daily's own card, THE PASSWORD failed (front
  door, 6 rows) by day, the back room failed inside SHARE TODAY, the YOUR CARD sheet at 390 × 844.
- **Not done:** SHARE YOUR RUN's podium card (PRISM DROP / OVERCLOCK — `ui/final.js`) is still drawn at the tap; it goes through the
  same sender (the sheet instead of a download). THE PASSWORD's own card still shows no "Nº"; THE DROP at 8:00 still says "THE END".

## Groups D + F (`3ea6d1d4`) — S12, the DISCONNECT test, K1–K6, S13
`attackSent` · the host kept alive until the kill · the additive kick (one-frame scale step 0.016 → 0.009) · real clears in `&heavy=1`
(60 fps re-measured: galaxy 59.6 / 60 · neon 59.8 / 60 · pixel 60 / 59.6 at 4× CPU) · the tiles one a frame · 8 px + the skin's arrow ·
the pinned night skin · `sfx-key.js` (measured in the real synth: galaxy's lock on the D-major song +2 st within ±15 cents, its clear
+200 cents; pixel's lock +1 st on C# minor, −3 st on E minor; a noise file ±3 % as before) · the preview's sound readout.
- **A DEVIATION, on purpose:** the brief says "root or fifth". A single note does exactly that. Galaxy's clear is a CHORD (C–E–G–B): on
  a minor song's root its third and seventh would be out of key, so a chord lands where all its notes are in the scale (major: root /
  fourth · minor: third / sixth). Ben's ear decides — the degrees are one table (`sfx-key.js#KEY_TARGETS`).
- F's items 3–4 (K4, K5) were NOT moved to the next pass — both are in.

## The add-on (`c8a90ffc`) — the games chat, Nov 14 4:14 pm (ADDONS.md, marked done)
(1) No message over the YOUR CARD sheet. (2) `api/_lib/dailies.js#testingEnv`: the test switch is honoured only off Vercel — a
deployment can never register THE TEST DAILY (it showed in this pass's own emulator test shot, which is no longer taken).

## Two more, found on the way to the push
- **The cards' fonts are IN before a card is drawn** (`7806a839`): a card built as the screen opens (S11) could come before a font weight the
  screen never used — on Ben's own check link the YOUR CARD sheet printed in the system's font. `js/daily/share.js#shareFonts` (≤ 2.5 s,
  never a failure) runs before every build. The preview's fake api now answers `today { share }` with the scripted share inputs, so the
  real tap there shows the full card.
- **Ben, the same evening — "make sure the PRISM DROP box is tall enough … shrink the three signal things a little"** (`7e159bbe`): the
  art strip's height is each daily's own (`STRIP_H` + `sectionH()`): THE DROP 228, COAST CLEAR 112, THE PASSWORD the rhythm's 145. With
  all three: the board's box 265 × 210 px on the card, 26-px cells (it was 177 × 138, 17-px); the lamps ≈ 90 px (≈ 127); the names / times
  ≈ 5 % smaller (one size in every section). `_old/cc-share.js` re-taken once more.

## Tests — local, before the push (this pass's own emulators + servers on :5173 / :5176 / :5177; all stopped at the end; :5190 left running)
| suite | result |
| --- | --- |
| unit (`node --test tests/*.test.mjs`) | 1922 / 1922 |
| rules · server · daily-drop · daily-module · progression · password · coastclear (`/api`, emulators) | 82 · 57 · 14 · 21 · 10 · 10 · 14 — all pass |
| `e2e-drop` | 53 / 53 (run twice — the second on the last commit) |
| `e2e-daily` (the tap-through + the wide-screen cases + the share tap) | 84 / 84 (twice) |
| share-same | 60 / 60 SAME |
| `e2e-password` · `e2e-coastclear` (FAST) | 40 / 40 · 38 / 38 (twice) |
| `e2e-prism` FAST · full (8 phones) | 67 / 67 · 94 / 94 (the full run twice in the pass — REFRESH, DISCONNECT, NIGHT LOOK green both times) |
| `e2e-playnow` WebKit · Chromium | 36 / 36 · 36 / 36 |
| smoke | 8 / 8 |
| harbor groups `core,dock,desktop,billboard,speakeasy,sightings,sheetstack,shell,tapfit` | 106 / 106 (NO full local harbor — the cloud runs it) |

## The cloud runs of the push
The ONE push: `9122b837..63548cc2` (10 commits, the harbor tag on the last). One run of each, not re-run.
- **tests** (43648300041): **GREEN**, 6m34s.
- **harbor** (43648300098): **RED — 13 of 15 jobs green**, 13m3s. Three checks, none in code this pass touched:
  - `city` · **LOAD WEATHER — kept on this device: "0 changes after"** saw `bake crossfade 1200 ms · neon` after the reveal. **It follows
    the clock, not the code:** the cloud ran it at 5:31 pm Eastern; on the mini PC at 5:44 pm the same neon crossfade failed the sibling
    case ("answered in 1.2 s") on this pass's code; at 5:52 / 5:55 / 5:58 / 6:02 pm the whole `load` group was GREEN (34 / 34, four runs alternating) on the commit from
    BEFORE the pass (a worktree on :5174) and on this pass's code alike. Dusk: the neon's bake changes as night falls and the checks use
    the real clock. NOT proven: the pre-pass code inside the red window (the window had passed). For the city chat — the LOAD WEATHER
    cases want a fixed `&when`, or the dusk change counted as expected.
  - `city` · **THE DELAY: "the city still rain after 3 s" read `snow`** (the panel's queued SNOW started although the reopened sheet had
    cancelled the countdown). Green locally on this pass's code (`ONLY=panel`, 5:47 pm). Cause not found; not a known flake.
  - `street` · **THE DANCERS' ARMS NEVER JUMP: 7 jumps** (6 dancers, 268 frames). Green locally (0 jumps over 446 frames). A check with a
    history of cloud reds (POOL FIXES' full run: 1 jump; PLAY NOW 0f's frame-stamp fix) — the cloud's software GL draws ~8–10 fps.
- **Vercel: BUILT + deployed** (`63548cc2`, Production — "Deployment has completed").
- This pass's servers (its emulators, :5173, :5176, :5177, the A / B's :5174) are STOPPED; :5190 is left running.

## Left open
- N1, N2, N3, N5, N8, N9 · N7's two others (THE PASSWORD's "Nº", "THE END") · C2 + C3 (the city chat) · S12's rule-side ledger (the
  next rules pass) · the previews' silence on Ben's iPhone (§9 — the readout now says why) · the podium's SHARE YOUR RUN built before the tap.
