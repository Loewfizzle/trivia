# JAYWALK — THE POLISH PASS (Nov 18 2026 — on the Beelink; the first pass after launch)

The owner's decisions: `docs/games/plan.md` "JAYWALK (the owner, Nov 18 — DECIDED, THE POLISH PASS)". The detail: `docs/jaywalk.md`
"THE POLISH PASS". JAYWALK is LIVE: every change small + tested; REPLAY = LIVE untouched; **no rules change** (nothing to re-publish).

## THE GROUPS
| group | commit | what |
| --- | --- | --- |
| Step 0 | 58bbff0a | the owner's four decisions in `docs/games/plan.md` |
| 0 — THE START | — | `lab-export.mjs https://www.neonspeakeasy.com`: 224 marks, **no FIX on any card** (nothing for JAYWALK). The cloud of 89d1cc41: `tests` green; `harbor` red in show (THE MUSIC BUTTON surge), perf (MEMORY 20 cycles), lobbyfix (THE ROOM NOTE — IDLE), audio (THE ROOM IN THE URL) — all the city's, none JAYWALK's (left for the city) |
| 1 — YOUR TABLE | 1fda7731 · bb4c2779 | ONE centred grid RANK \| CARD \| SCORE in the end screen's own column; the label CENTRED (the inbox's 6:55 am correction); every slim card's name ONE line (shrink → an ellipsis) |
| 2 — THE SHARE CARD + HOW TO PLAY | 6c369305 · 9efdb528 | the cause line's dark band (both looks); HOW TO PLAY's 11th line — the Mothership ends a MATCH at 6:00 |
| 3 + 4 — THE LATE k WRITE · THE RENDER LEFTOVERS | 6230d201 | the call never writes after the match moved on / on a pick already out; the far lanes lit after a real lost context; the lines' words proven on top |
| 5 — THE FRESH-EYES REVIEW | 035300c3 | the review's in-scope fixes: the header centred, the card's foot deeper, the Mothership's drawing |

## YOUR TABLE — BEFORE / AFTER (390 × 844; `Downloads\NEON\jaywalk-polish\before\` · `game\` table-360 / 390 / 430 / 1440)
- **Before:** the block 334 wide at 390, 28 px in from each side (the bar + the XP box 16 px) — the label 2 px off the rank column, the
  ranks hanging far left, the score column `auto` (a 3-digit score narrowed its own card), the cards off-centre (their centre 184 of 195);
  the names: right-aligned on friends' cards, left on yours, in the numerals' font — JAYWALK's own `.jw-table-list b` reached INTO the cards.
  HOPPER split "HOP / PER" (the shared card kept 124 px beside a non-friend's plate + the fitter's two-line split).
- **After:** the block = the PLAY AGAIN bar's edges (16 | 374 at 390; ≤ 440 centred at a desk), one card box (64 / 290 at 390), dead centre
  (195.0 of 195.0), the rank + score columns one width, scores right-aligned at one edge, the label centred over the cards; MAXIMILIANOS (12) ·
  ALEXANDRIA (10) · DIMETIME (8) · HOPPER (6) whole on ONE line at 360 (14 px the smallest) / 390 / 430 / 1440.

## THE CHECKS (fresh emulators + `serve.mjs --emu`; NEVER THE LIVE SITE)
All green, one after another, nothing else busy: smoke (THE PAGES LOAD) 21/21 · e2e-jaywalk 93/93 (YOUR TABLE at 4 widths, the far lanes after a
REAL loss 0.229 → 0.218) · e2e-jaywalk-match 88/88 (3 phones — THE LATE k WRITE: 0 refused, 0 expected) + 89/89 (`--four`) · e2e-rematch 25/25
(2 phones) + 29/29 (4) · the lab check 108/108 + `--perf` 127/127 (59.9 fps tier 2 at 4× CPU) · jaywalk-mix (23 cues, none clips) ·
wk-jaywalk-mem 48/48 · harbor `cartridge` + `stripfit` 5/5 · harbor `vault` 58/58 · rules 85/85 · /api 66/66 · share-card 2/2 · unit 2,207/2,207
(registration · cartridge · achievements · THE BOOT BUDGET · THE PER-GAME BUDGET · CLAUDE.md size · the docs' links · file hashes).
THE BOOT: 307 modules, 16,529 B of room (budget untouched) · JAYWALK's size: 255 B under its 2,450 KB (budget untouched).

## THE FRESH-EYES REVIEW (a reviewer with a fresh context, read-only; the shots: `Downloads\NEON\jaywalk-polish\`) — its report, verbatim
> FRESH-EYES REVIEW: JAYWALK polish pass. I looked at every listed shot, plus crops of lost-context-rebuilt and table-1440.
>
> GOALS
> 1. YOUR TABLE: **met.** game\table-360/390/430/1440 are one centred grid. The cards are the same box with the same left edge, the scores are right-aligned in one column, and YOUR TABLE is centred under NEW BEST. No name wraps. Compare before\table-390, where HOP/PER split and ZO and LIAM were right-aligned.
> 2. Share-card cause band: **met.** The cause line reads on all six cards at preview size, including day-water and day-wall (fog). The band is square-cornered, not a pill.
> 3. HOW TO PLAY Mothership line: **present** in help\jw-help-end-390x844 and help\jw-help-end-360x780. Its drawing is weak (see 4).
> 4. Lost context: **met to my eye.** In game\lost-context-rebuilt the far lanes are lit about as brightly as in the fresh line-best-coming shot.
> 5. Lines over vehicles: **met** in both looks. The words sit on top of the truck, the cars and the taxi, and only the kid covers "BEST".
>
> WEAK POINTS, MOST SERIOUS FIRST
> 1. **share\day-water, night-water, day-wall, night-wall (and preview-cards):** the run's picture shows no kid at all. Four of the six cards are an empty strip of logs, fog or darkness. In day-car and night-car the van hides the kid completely, leaving only a cyan smear and a hand under it. At link-preview size the picture doesn't tell the story of the death. It reads as a random stock frame, which falls short of the premium bar.
> 2. **share\day-wall-540x675 (fog) and day-water:** the big score and "LANES" have no band of their own. "31 LANES" sits on near-white fog, and the pale-pink "LANES" is the lowest-contrast text on any card. On day-water, "32" sits over pale blue water. The score is the card's headline, yet it is now less readable than the cause line.
> 3. **game\table-1440:** the ☰ button covers the "J" of "JAYWALK · SOLO", so the title reads "AYWALK". The header title is also left of centre while everything below it is centred. On phones (390/430) that title starts beside the ☰, about 50 px left of the centred column, so the top looks lopsided.
> 4. **help\jw-help-end-*:** the Mothership drawing looks like a green stool or table (an oval with three legs), not a ship with a beam. It sits right under the green UFO-ring drawing, so two similar green icons stack together. The line is also filed under WATCH OUT, though it isn't a hazard. On help\jw-help-390x844 nothing tells a player that more lines lie below the fold.
> 5. **lines\*-over-the-words (both looks):** the friend's words "LIAM · 212" sit on the gold YOUR BEST line, not by their own pink tape about 60 px above. A player can't tell which label belongs to which line. Also, the kid hides the "E" of BEST in every shot (allowed, but it happens every time). This is staged in the lab, so it may be a lab artifact, but it's worth checking in a real run.
> 6. **game\lost-context-rebuilt:** the pink "7" of "LIAM · 7" is drawn over a yellow taxi, and pink on yellow nearly disappears. The words are on top as intended, but they can't be read at that moment. The day look would be worse.
> 7. **game\table-360:** MAXIMILIANOS and ALEXANDRIA are shrunk visibly smaller than DIMETIME and HOPPER. Mixed name sizes in one four-row list look uneven. This is within the rule (shrink before ellipsis) but less polished. At 390/430 all names are the same size.
> 8. **game\table-390, end-new-best, end-day:** the player's own row (HOPPER, 4th) is marked only by a pink rank "4". The card, frame and score look the same as the friends' rows. On a phone, "where am I" should jump out.
> 9. **game\table-390 / end-*:** the "PERSONAL BEST SET" row is cut in half by the MORE BELOW fade. Ghost fragments (the icon, "10") show through, so it looks like a glitch rather than a scroll hint.
> 10. **Night far edge (run-start, line-best-coming, lost-context-rebuilt):** in both the fresh and the rebuilt scene, the grass lane just under the sea wall is close to black, with trees barely visible. The rebuild fix holds, but the far edge reads muddy at night.
> 11. **game\end-day:** "JAYWALK · SOLO" and "LOST IN THE FOG" sit on a bright sky and skyline. They read because of the glow, but contrast is marginal. A gull also overlaps the music button.
>
> NO ISSUES FOUND: the share cards' frames and brand block, the solo end screen's hierarchy (cause, 10, LANES, NEW BEST, table), the help text size at 360, and the day run's HUD.

### What became of each point
1. The share picture shows no kid on 4 of 6 (water / the blackout: the frame is 460 ms after the hit — he is already swept / taken) →
   **OPEN FOR BEN** (the frame's moment is H4B's design: an earlier frame or a kid marker is a new look call).
2. "31 LANES" on the white fog → **FIXED** (035300c3 — the card's foot a deeper dark, 330 px, 0.62 → 0.92).
3. ☰ over the header's J at 1440 + the header left of centre → **FIXED** (035300c3 — centred between the corner buttons; pre-existing).
4. The Mothership's drawing read as a green stool beside the UFO's ring → **FIXED** (035300c3 — a pink ship: dome, lights, beam). Filed under
   WATCH OUT as the owner's line says; the help's scroll hint is the shared sheet's (its bottom fade) — not changed.
5. The friend's words on the gold line in the lab shots → a LAB staging artifact (the two lines one lane apart on purpose); the real run puts
   each line's words by its own tape — no change.
6. Pink "7" over a yellow taxi hard to read → **OPEN FOR BEN** (the words ARE on top; a stronger halo / a plate behind the words changes the
   H5C look the owner approved).
7. Mixed name sizes at 360 (MAXIMILIANOS 14 px) → within the owner's rule (shrink before an ellipsis) — no change.
8. Your own row marked only by its pink rank → **OPEN FOR BEN** (a highlight for your row is a new look call).
9. "PERSONAL BEST SET" cut by the MORE BELOW fade → the console's frame (`ui/final.js`) — **sent to the city** (the inbox).
10. The night's far grass under the sea wall near black → pre-existing (H5C's far edge) — **OPEN FOR BEN**.
11. The day end screen's header on the bright sky + a gull on the music button → pre-existing — **OPEN FOR BEN**.

## OPEN FOR BEN
1. RE-PUBLISH: **nothing** — database.rules.json unchanged.
2. **THE NAME RULE CHANGED ON EVERY SLIM CARD** (your 6:55 am entry): one line, shrunk to 12 px, then an ELLIPSIS — it overrides THE VAULT
   1B's "never an ellipsis" on slim cards only (the full card + the podium keep the two-line split). Measured: no real-length name reaches the
   ellipsis in YOUR TABLE; the widest twelve (W×12) does on 11 hero-capped strips at 390 (harbor `stripfit`).
3. The review's look calls (above): the share frame with no kid (1) · pink on a yellow taxi (6) · your own row's highlight (8) · the night's
   far grass (10) · the day header's contrast (11).
4. THE DAILY's best label ("DAILY BEST · 168 LANES" / "NEW DAILY BEST") is recorded for the dailies chat (Step 0) — not built here.
5. For the city: the XP box cut by MORE BELOW on JAYWALK's end screen (review 9); CITY G's four harbor reds (Group 0).
