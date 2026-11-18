# DAILY FIX — the ticket + share polish from DAILY B's OPEN FOR BEN (Nov 18 2026)

The owner's decisions: `docs/games/plan.md` "DAILY FIX — approved Nov 18" (Step 0). The detail: `docs/progression.md` "DAILY FIX". The lab
export at the start: 224 marks, no open FIX. The inbox: none at the start; the Nov 18 12:30 pm entry (THE RED JAYWALK MEMORY CHECK) arrived
after Groups 1–7's commit → built as the LAST group, before the final run.

## WHAT CHANGED
1. **LAST TRY ·** — JAYWALK between tries: "LAST TRY · 143 LANES" as the big line (ONE line: the label 10 px quiet, the lanes 15 px), DAILY
   BEST under it, TRY AGAIN + "N TRIES LEFT" on the right. The widest value ("LAST TRY · 888 LANES") fits at 375 with 7 px to spare — the FIT
   checks (375 × 667 / 390 × 844 / 430 × 932, both looks) run it (`&jwlast=888&jwbest=888`) and check the line is ONE line, whole. Unit: `tests/daily-fix.test.mjs`.
2. **SAVE YOUR KEY** never pops over THE DAILIES screen: `KEYPOP_COVERED` + `.dy-overlay:not(.screen-out)` — it waits, then shows once the
   player has left; LATER → never again (the dot). e2e-daily's new case: asked with the screen up → held; the screen left → shown; LATER → none.
3. **THE SERIAL** "Nº 1108": 10 px, ≥ 4.5:1 on its paper in both looks (night .62 → .84 alpha; day #5a6f93 → #3a4f75) — still the stub's quiet line.
4. **THE PASSWORD's DAY STAMP**: its own deeper ink (`TICKET_INK.password.stampDay` #1450c0, 5.6:1 on the cream — was ≈ 4:1), full ink,
   a heavier outer edge. Night unchanged (it wasn't pale).
5. **PLAY IN ITS TICKET's INK**: every PLAY / RESUME / TRY AGAIN is a tube of its ticket's `TICKET_INK` (night ink at night, day ink by day);
   letters white on the dark tube at night, the ink deepened 55 % toward #0b1630 by day (every ink ≥ 4.5:1 — the unit test computes them).
6. **THE SHARE CARD AT 360**: THE 360 FLOOR — no name / stat line under 30 card px (≈ 10 px at 360) whatever the section scale (4 sections:
   the stat lines were ≈ 6.7 px, now 10); the section rules 4 px in a firmer ink (visible at 360 in both looks). The 1-section card (a
   daily's own) and the 2-section card keep their sizes exactly (the floor only lifts a card's scale below ≈ 0.94). Checked: 4 sections
   full + 360 (night + day), 1 / 2 / 3 sections (both looks).
7. **The reviewer's plain defects, fixed**: #12's "faint vertical hairlines at x≈280 / 800" were NOT in the card — the preview page's
   desktop column frame (`#stage::before / ::after`) drawn over it; the preview hides it in the share view. #3's THE DROP ticket result
   "2:38.9 · 101 / LINES": a ticket result now wraps only between its parts. (#7, #8, #10, #13 = items 3 / 4 / 5 / 6 above.)
   Skipped as taste calls: #2 (TODAY's centred block — DFIX3's own design), #9 (COAST CLEAR's searchlight mark — DFIX5's design), #12's
   green / white section names (THE ONE RULE), #13's numberless JAYWALK bars.
8. **THE INBOX — THE RED JAYWALK MEMORY CHECK** (`wk-jaywalk-mem.mjs` "10 runs in a row": 4–7 views vs the limit 3): **case (2) — WebKit's
   own LAZY GC, PROVEN**, not a holder in the code:
   - reproduced on this build: 7 views alive after 10 PLAY AGAINs (three churns);
   - a probe counted them over time after 10 runs: `[0,1,3,5,7,8,9]` at t+2 / 6 / 9 s, then `[8,9]` at t+12 s, flat to t+90 s — views of
     runs that ended MINUTES earlier freed in the same beat (nothing of theirs on a timer held them);
   - Chromium, 6 PLAY AGAINs + a forced `HeapProfiler.collectGarbage`: ONLY the current view alive (no retainer path to any old one);
   - after BACK TO THE CITY WebKit is at 1 view (the old check's own LEAVE × 5 line).
   So the check now waits for a SETTLED GC (`settledViews`: churn until ≤ 3, up to 45 s — the seconds it took printed) and the limit stays 3.
   `--daily`: JAYWALK's DAILY, 3 tries in a row (TRY AGAIN), the same count.

## OBVIOUS CALLS, NAMED
- RESUME + TRY AGAIN take the ink too ("every PLAY button"), with a quieter outer glow than PLAY (they are the secondary kind).
- The LAST TRY label is quieter than the lanes inside the ONE line (the lanes stay the big number).
- The CLAUDE.md line: folded into the existing THE TICKET line (the file was 30 bytes under its cap).

## THE FINAL RUN
(filled in below)

## OPEN FOR BEN
(filled in below)
