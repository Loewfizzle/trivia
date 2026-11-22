# THE GARDEN PARTY PASS — HEAR THE HARBOR + GARDEN PARTY (Nov 21, 2026)

The pass in one line: the music off now plays the harbor (water, hum, boats, the city's one-offs) on the same no-squeal session as the music on,
from ONE table applied whole; GARDEN PARTY is the LV 34 card; the last four slim cards match their live strip; the join-code box opens the
keyboard on the first tap.

## OPEN FOR BEN
1. **RE-PUBLISH: nothing** (no rules change). J2's `database.rules.nov21-j2.json` is still yours before Nov 27 if not yet published.
2. **MARK GARDEN PARTY in THE CARD LAB** (strip + full card — NEW, n 229 / 230): only approved art ships — until your APPROVE an owner sees its
   placeholder palette. Shots: `Downloads\NEON\garden-party\`. Also re-mark INFERNO (v3), VELVET NOIR (v2), MARQUEE GOLD (v2) — CHANGED: their
   list strips' first frame now matches the live strip (nothing about the cards themselves changed).
3. **PHONE CHECKS** after the deploy:
   - **music off = HEAR THE HARBOR**: tap ♪ once (the slash) — hear the water / the hum / the boats + the taps' effects, no music; leave + return the
     home-screen app a few times: no squeal. **All off (🔈✕) + a podcast**: the podcast plays, the site is silent. (Music off now sounds through
     the ring / silent switch — it is the same 'playback' session as music on, your spec.)
   - **GARDEN PARTY**: in CUSTOMIZE (once approved) + on THE BOARD — the flowers fill the slim card, petals drift, the sun sparkles.
   - **THE CODE BOX**: JOIN → one tap on the four boxes opens the keyboard.
   - **A PB share card**: a new best in JAYWALK / HIGH RISE → SHARE: the number in gold + PERSONAL BEST (`Downloads\NEON\pb-share\`).
4. **Calls you can overrule** (THE CALLS MADE below) — the two most likely: the idle cutoff (5 h) + a second tab now leave the harbor playing (the
   "music off" switch), and HEAR THE HARBOR leaves by C2's ramp (the 'ambient' hard cut retired).
5. Seen, not this pass's: `e2e-taps`' "TODAY'S SCORES opened" fails on this machine's emulators in both engines (no daily code touched — for the
   daily chat); the harbor vault group's five 4×-CPU lobby speed checks fail on this machine on the PRE-pass code too (the cloud judges them).

## GROUP 0 — the start
- THE LAB (`scripts/lab-export.mjs https://www.neonspeakeasy.com`): 224 marks, **no open FIX**; 10 CHANGED rows wait for the owner's re-mark.
- The inbox: the Nov 21 4:14 pm JAYWALK KEEP note marked "✓ read" — nothing of J3's daily undone.
- CITY PART 2's cloud run (`[harbor]`, 44881884935): **harbor RED** — `audio` (THE LAB 2.0's counts: 29 CHANGED / 44 NEED YOU since CITY PART 2's
  five strip-match bumps — the check still expected 24 / 39), `room2` (`sheetstack`: a null click), `perf` (MEMORY: 20 title↔setup cycles, heap
  +38.8 MB). HIGH RISE DAILY B's `tests` run (44976298920): **red** — `tests/integration/vault-2c.test.mjs` hard-coded card-smoke's lab version 1
  (CITY PART 2 bumped it to 2). Each one: below.

## GROUP 1 — MUSIC OFF = HEAR THE HARBOR (the inbox's Nov 21 10:08 am entry)
The full text: docs/audio.md "THE GARDEN PARTY PASS — MUSIC OFF = HEAR THE HARBOR".
- THE SOUND TABLE (`sound-state.js#SOUND_TABLE`): MUSIC ON · HEAR THE HARBOR · ALL OFF, each one row (session · music · beds · one-offs · effects),
  applied WHOLE on every change in one order (`engine.js#applySound`). PODCAST MODE's nap + wake-ups removed; THE HOLD's lease kept (no-op).
- THE CALL MADE (follows the project's own tested path): **HEAR THE HARBOR leaves by C2's path** (the ramp at the first signal, the zeros, the
  suspend), the same as MUSIC ON — CITY G's 'ambient' HARD CUT is retired with 'ambient'. The evidence: `audio-cut.mjs` D measured the hard step
  itself as a burst once the beds run (0.155 vs the sound's own 0.147); the owner's iPhone squealed on the hard cut with beds running on
  'ambient'; C2 never squealed (Nov 16). ALL OFF's beds stop at THE HUSH's suspend, under the zeros (`audio-cut.mjs` A + C caught the first
  draft stopping them at the switch).
- /admin's AUDIO LEAVE: `ctx at the leave: RUNNING · HEAR THE HARBOR · session playback · …`.
- `audioHealth()` had `session` twice (the second won) — the asked session is now `want`; `sound` = the row's name, `resting` = the music's rest.
- Tests: unit `audio-session` 14 (the table · EVERY PATH > 1,500 states · the leave · THE HOLD), `audio-hush`, `podcast-sweep`, `jaywalk-podcast`;
  browser — NEW `sound-table.mjs` 181 / 181 (Chromium + WebKit), `audio-leave` 27 / 27, `audio-cut` 33 / 33, `audio-hush` 9 / 9, `sound-sync`
  42 / 42, `podcast-sweep` 14 / 14, `jaywalk-podcast` 5 / 5.

## GROUP 2 — GARDEN PARTY (the inbox's Nov 21 8:32 pm (1) + its 8:34 pm correction)
The full text: docs/vault.md "GARDEN PARTY". GARDEN PARTY only (PINK RIOT + THE VANITY untouched, unbuilt) — epic, the purple gem, **LV 34**
(`LEVEL_REWARD_ROWS` + `REWARD_LEVELS`); owners already past 34 get it ONCE through THE CARRY-OVER (the existing added-row pattern —
`progress.js#carryOver` at the next match / `me` call; `grant` never re-adds an owned id).
- The art: copies in `art/garden-party/src/` → `scripts/build-garden-party.mjs` → `assets/vault/gp/` (garden 103 KB · petals sheet 14 KB ·
  sparkle 33 KB — never on the boot path: the vault's lazy chunks + the card's CSS only).
- The motion `js/fx/gp-card.js` (the petals drifting + the sun sparkles twinkling in turn); the still `card-garden-l.webp` (THE SLIM-CARD LAYER);
  THE STRIP MATCH 0.3 (402) / 1.9 (330).
- THE CALL MADE (the established rule): NEW in THE LAB at v1 (n 229 / 230) — a new item never shows CHANGED, so no LAB_V bump; its lab text written.
- Refine 1 (the full card): the hero box was the whole table → a 12-letter name wrapped (LOEWFI / ZZLE12); now the bouquet's face → one line
  at 375 / 390 / 1440 (the plate over the bouquet's left third). Refine 2 (the strip): the tier gem's plum backing (SONIC BOOM's pattern).
- Shots (Downloads\NEON\garden-party\): the full + slim card at 390 / 375 / 1440, CUSTOMIZE (NEW `fullcard-preview.html?dress=`), THE PLAYER PAGE,
  THE BOARD (NEW `board2-preview.html?cd=`).
- `tests/garden-party.test.mjs` (7): the row, the one-time grant, names only to owners, the lab, the crop = the CSS, the hero, the plates, the motion.

## GROUP 3 — THE LAST FOUR SLIM CARDS (inferno, noir, neoncamo, marquee-gold)
The full text: docs/vault.md "THE LAST FOUR SLIM CARDS". Pinned: INFERNO's still had calm 0 (a list draws calm 1 — the flames shorter); all three
lay out by the strip's WIDTH (MARQUEE GOLD's bulb count steps every 10 pt); the still replaced the material with black. Fixed: stills kind `w` —
transparent, the lists' options, one per width step, over the material, picked by a container query (Chromium + WebKit). Strip match (max 9):
inferno 19.2 → 7.2 · noir 20.9 → 1.3 · marquee-gold 10.3 → 0.4 at 402 (330 / 430 all under 2); NEON CAMO was already under (7.8) — kept.
LAB_V: INFERNO 3, NOIR 2, MARQUEE GOLD 2 + their lines.

## GROUP 4 — THE CODE BOX's FIRST TAP (the inbox's Nov 21 8:32 pm (2))
The full text: docs/title.md "THE FIELD IN A LABEL". THE TAP WATCH focuses a label's text field in the touch — the press for `data-focus-press` (the
code box), every clean lift for any label-wrapped field; handled, never rescued. The code box's `setTimeout` focus removed. `e2e-taps.mjs` (N 4):
THE CODE BOX 4 / 4 in WebKit + Chromium. Seen, NOT this pass's (no daily code touched): `e2e-taps` "TODAY'S SCORES opened (the dailies
answered)" fails in both engines on this machine's emulators — named for the daily chat.

## THE FRESH-EYES REVIEW (a separate agent that wrote none of it — the code + GARDEN PARTY's shots)
Found (ranked) → what was done:
1. MEDIUM — the `l` (CITY PART 2's) + `w` layers' selectors `.vl-s-<mat>:not(.fx-on) > .vl-mat::before` also matched the FULL card + the level-up
   swatch (they carry `vl-s-<mat>` too) — a strip layer stretched over a full card until its first paint, for good on the swatch. **FIXED**: scoped to
   `.vl-strip`; CUSTOMIZE's mini tile (a `.vl-strip`, far under 280 pt) gets the middle width cover-cropped at the hero.
2. MEDIUM (a call) — the idle cutoff (5 h, no tap) + a yielded second tab use the page-quiet switch = the music off → now HEAR THE HARBOR: the harbor
   plays on. **NAMED** (THE CALLS MADE): the switch means "the music off", as its words say ("Music paused"); overrule → those two reasons map to ALL OFF.
3. LOW — the silent switch: the music off is 'playback' now, so the effects sound with the iPhone's ring / silent switch on (by the owner's spec).
   **FIXED** the stale comment (js/daily/sfx.js); named for the owner below.
4. LOW — a fling-stop on a label focused its field. **FIXED**: the lift + the press both skip a stopper touch.
5. LOW — GARDEN PARTY's petals faded from 0.93 w — the gem sits at ~0.94. **FIXED**: gone by 0.92 w (the layer still re-baked).
6. LOW — per-frame closures in gp-card.js's draw — in line with the other card effects (no zero-garbage rule outside HIGH RISE). Left.
7. LOW — stale "nap" words in HIGH RISE's stage.js (the game chat's file) + a few test titles. Left (harmless).
Checked fine by the reviewer: applySound's order, every transition (blur / hidden / interrupted returns), no song element in HEAR THE HARBOR, no
removed export referenced, holdAwake's callers, the LV 34 grant (never twice), the shots' legibility, reduced motion, container-type on .vl-mat.

## THE CALLS MADE (obvious / established — overrule any)
- HEAR THE HARBOR leaves by C2's path (the 'ambient' hard cut retired — audio-cut D's burst with the beds on; your report of a squeal on it).
- The idle cutoff + a yielded tab = the music off = the harbor plays on (review #2).
- The music off now sounds through the iPhone's silent switch ('playback' — your spec's session).
- GARDEN PARTY enters THE LAB as NEW at v1 (no LAB_V bump for a new item); its full card's plate may sit over the bouquet's left third (a 12-letter
  name on one line).
- NEON CAMO kept its old still (7.8 alone; 11.4 in the all-78 strip-match run — the renderer's tier under 78 live effects, not the still).

## THE BOOT ROOM (THE BOOT BUDGET's bytes, 6,500 KB / 310 modules)
Before (c557ba73): 304 modules, 20,747 B of room · After: 304 modules, **22,094 B** of room (the engine lost the nap) — GARDEN PARTY's art + effect
never on the boot path (the vault's lazy chunks + its CSS's image only when a card shows).

## GROUP 5 — THE PERSONAL-BEST SHARE CARD (the inbox's Nov 21 11:16 pm — arrived before the final tests: built)
The full text: docs/jaywalk.md / docs/highrise.md "THE PERSONAL-BEST CARD". A server-confirmed NEW PERSONAL BEST → the big number in the house gold
(NEW DAILY BEST's foil — ONE table in daily/share.js) + PERSONAL BEST under it, on JAYWALK's run card + HIGH RISE's poster; a NEW DAILY BEST paints
the dailies' big line gold (JAYWALK night + day; HIGH RISE's daily poster gets PERSONAL BEST too). JAYWALK's card has no day look (its run card is
night-only, as HIGH RISE's poster) — the day shot is the daily card's. NEW `tests/integration/pb-share.mjs` 9 / 9; highrise-share 120 / 120;
share-same 75 / 75 SAME; five source pins updated. Shots: Downloads\NEON\pb-share\ (normal vs PB, each card).
A call: JAYWALK's daily keeps its own words under the gold big line ("BEST OF 3 · NEW DAILY BEST" — THE ONE RULE's single stat line).

## THE FINAL RUN (this pass's own emulators + `serve.mjs --emu`; the rules + /api on FRESH emulators after the browsers)
unit **2,543 / 0** · smoke **24 / 24** · e2e-profiles **148 / 148** · e2e-highrise (FAST) **70 / 70** · harbor music + mediacut + sounds + show +
sheetstack **138 / 138** (mediacut re-run 6 / 6 after the check's own ramp wait) · harbor vault 53 / 58 (the lab counts green; the five 4×-CPU
speed checks fail identically on the pre-pass code here — the cloud's call) · sound-table **181 / 181** (Chromium + WebKit) · audio-leave **27 / 27** ·
audio-cut **33 / 33** · audio-hush **9 / 9** · sound-sync **42 / 42** · podcast-sweep **14 / 14** · jaywalk-podcast **5 / 5** · e2e-taps (N 4) THE CODE BOX
4 / 4 both engines · strip-match (402 / 330 / 430) GARDEN PARTY + the four green · stills current · pb-share **9 / 9** · highrise-share **120 / 120** ·
share-same **75 / 75** · rules **101 / 101** · /api server **72 / 72** · vault-2c + vault-2b (alone, a clean database) green.
The full harbor suite: the cloud's, on this harbor-tagged push (THE LOCAL TESTING RULE). Every server this pass started stopped at the end.
