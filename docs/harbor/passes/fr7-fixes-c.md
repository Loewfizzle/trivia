# FR7 FIXES C — THE CLAUDE.md DIET + THE ONE DAY LINE + THANKSGIVING's MAPLE LEAVES + THE SMALL ONES (Nov 13 2026)

The owner's notes: plan.md "OWNER'S NOTES — NOV 13 (after JAYWALK CARDS + THE TRI-VISION)" (+ decisions.md). On the beelink. **No database
rules change.** Still 8 functions. Each group committed on its own; ONE deployment (the final push's top commit carries the harbor tag).

## Step 0
plan.md's notes appended unchanged + the BUILD TABLE line; decisions.md: the current line, THANKSGIVING's SIGN = THE MAPLE LEAVES + THE GOLD
WEEK (the wreath + swags + the one-day amber retired), THE CLAUDE.md DIET as a standing rule, the reset Monday, the JAYWALK poster add-on
(the owner's iPhone, 3:12 am) — `2efe4737`.

## Group 1 — THE CLAUDE.md DIET (docs only — `72745e71`)

- **CLAUDE.md 106,522 → 28,446 bytes** (the target ≤ 36 KB; the guard 40 KB). It keeps the intro, the doc table, the ground rules, ONE line per
  standing rule by area (City 2.0 · the console + the room · profiles / progression / THE BOARD · THE VAULT · the dailies · the games · deploy +
  launch + safety), working efficiently, a short file layout, the data model, short multiplayer / audio / design system, the add-a-game
  checklist, the testing short version, the Firebase notes.
- **MOVED, VERBATIM** — every per-pass paragraph into the doc that owns its area, under **"THE RULES FROM CLAUDE.md (moved Nov 13)"** (17 docs:
  harbor, overclock, prism, holdem, progression, vault, profiles, launch, testing, title, audio, data-model, cartridge, match-kit, coastclear,
  password, roadmap-history — the doc-table rows each with their doc; the full old file layout + multiplayer mechanics in data-model.md).
- **NOTHING LOST:** `node scripts/claude-md-coverage.mjs` (the old CLAUDE.md from git `48e3e157` — 900 backticked names + 690 ALL-CAPS names —
  each found in the new CLAUDE.md or a `docs/*.md`) → **0 missing**.
- **THE GUARD:** `tests/claude-md-size.test.mjs` — fails above 40 KB ("move the detail to its doc, keep one line") + every "(moved)" pointer has
  its section. CLAUDE.md's first section says the rule: a pass adds AT MOST one line per new standing rule.

## Group 2 — THE ONE DAY LINE (Grok's PROGRESSION + CALENDAR review — the detail: docs/progression.md#the-one-day-line)

Every finding checked against the code first — all nine were real, all fixed:

| finding | state | the fix | the test |
| --- | --- | --- | --- |
| M1 credited at REPORT time | FIXED | the MATCH TIME (`night.at` / the dealer's end, ≤ now) through `applyMatch(…, at)` → `matchStep({ at })`; before `progress/resetAt` → sealed `pre`, `before_reset` (both paths); the queue never drops by its own clock | unit `one-day-line` M1 ×4; `server.test` "THE ONE DAY LINE (M1)" ×2 |
| M2 the ceiling / +25 / +10 / solo cap at midnight; a capped match no streak | FIXED | all on the streak day; `day` + `pd` boxes; `ceilingStep` marks the streak | unit M2 ×3 |
| M3 the 4 am line drifts with DST | FIXED | `week.js#turnAt` / `turnDay` (4:00 wall clock); `msToTurn(instant)` | unit M3 ×4 (TZ unset, UTC, Los Angeles) |
| M4 a 2nd match inside 45 s sealed done | FIXED | `too_soon` / `busy` → `results st: 'retry'` + 425 `retryAfter`; the queue resends (≤ 8) | `server.test` "offline retries…" (the forged-quick match now counts on the resend); unit M4 |
| S1 the week at Monday 00:00 | FIXED | `weekKey` / `weekEndsAt` on the 4 am day (Monday 4 am); an older week's match → `xw.p`, never resets this week | unit S1 ×2 + `board-xp` / `profiles` week tests moved to 4 am |
| S2 PENTHOUSE closes before a late honest run | FIXED | `daily-close.js#recloseDay` (union — only adds) | `daily-module` "FR7 FIXES C — S2" |
| S3 WIN IT BACK → a second FAVOR | FIXED | milestones only above the lost run | unit S3 |
| S4 a pre-reset daily paid; the back-fill could take a counted play away | FIXED | a start before the epoch not paid (`pre: true`, out of the count); `cp` = max(live, rebuilt) | `daily-module` "FR7 FIXES C — S4" |
| S5 0 freezes shown after the reset | FIXED | `streakView` reads `st.f` | unit S5 |

THE RESET MORNING (Grok's order) → `docs/launch.md` §1 (a MONDAY a few minutes after 4 am ET); the back-fill line re-checked (true after S4).
No rules change (the new fields — `pd`, `xw.p`, `results/{key}.st: 'retry' / pre` — are server-written under the root deny).
