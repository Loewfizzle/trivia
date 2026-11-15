# DFIX5 — COAST CLEAR's DIG FEEL + EVERYONE ON SCORES + THE TAP-THROUGH + THE SPOT ICONS — Nov 14 2026

The plan: docs/games/plan.md "DFIX5" (Step 0, `546a4f45`). On the mini PC. **No database rules change** (every new node is server-only — the
rules' default deny). `/api` changed (`api/daily.js`, `api/_lib/cc.js`, `api/_lib/lb.js`, the new `api/_lib/every.js`) — within the same eight
functions. The reference: docs/coastclear.md "DFIX5" · docs/progression.md "EVERYONE ON SCORES" · docs/data-model.md `dly/` (t, e, x) · docs/title.md
"A SCREEN ON TOP OF THE CITY" (re-proven).

## Groups 1–3 — COAST CLEAR's DIG FEEL (`64a3d1c0`)
- **Measured:** live (plain GETs only): cle1, a warm call 60–75 ms to the first byte (now and then ~170), a cold one 1.1 s. Emulators before: the
  dig round trip p50 14 · p95 34 ms; the server 7 ms (auth 1 · load 3 · tx 3). The server's work was already small (DFIX3); its live cost is two
  database round trips cle1 ↔ Iowa per dig — and the dig waits for the finger's lift.
- **The owner's readout** under the board — "DIG 177 MS · SERVER 3 MS · NET 174 MS · MEDIAN 177 MS" — only for ADMIN_PIDS (the server's `start`).
- **THE HELD RUN:** a warm dig = ONE database round trip (the record + the start held on the instance between moves). After (emulators): p50 13 ·
  p95 19 ms; the server 3 ms (load 0 · tx 1). On the live site: ~20 ms off every warm dig.
- **THE SONAR PING** on the touch-DOWN (two rings, 190 ms, both looks, reduced motion = a flash); the number SURFACES when it lands (120 ms, never
  held back); a long-press is still a buoy.

## Groups 4–6 — EVERYONE ON SCORES + THE SPOT ICONS (`13b53784`)
- SCORES = EVERYONE by default (Ben's mockup) — the top 10 + YOU + SHOW ALL, FRIEND in gold foil, the drawn FRIENDS box (unchecked every visit) →
  YOUR TABLE; ALL TIME = the daily's board top 10 + YOU; the ticket = "4TH OF 12 TODAY".
- The server: `dly/{game}/{day}/t` (the day's top 50 counting finishers, one transaction per counting finish, ties → the earlier finish), `every`,
  public faces only (never a pid), same-day profiles never listed.
- COAST CLEAR's result = the time + a drawn searchlight per spot (0–2), the server's own count (`e/{pid}`).
- **Group 5 (no tap reaches the city):** already fixed in SKINS 2B (`097dcc34`, live since PFIX-3's deploy — Ben's report was from before it);
  re-proven here on the new layout by e2e-daily's real-touch sweep.

## Decisions taken in the pass (worth Ben's eye)
- **No pid in a row:** the brief listed "pid" among the row's fields; the rows carry the board id instead (THE BOARD's standing rule — never a pid
  in public). Friends are marked by the server (`f: 1`) / by their board ids (`points.ids`).
- **Scores before you play:** the everyone list shows the cards + PLAYED, no score, until you finish that daily — YOUR TABLE's existing rule.
- **SHARE TODAY unchanged:** its COAST CLEAR section already draws ONE LIT LAMP PER SPOT in its art strip (+ "1 SPOTTED · +30 s") — adding lamps
  beside the big time would say it a third time and break THE ONE RULE's rhythm. **Ben (Nov 14, after the pass): keep it as is.**
- **No touch sound** (the brief's optional sonar tick): a new sound would be a new file (Grok) — the reveal sound on landing stays the only one.

## Known issues (not this pass's)
- COAST CLEAR's end line with a pause wraps a lone "s" at 390 ("… 1 PAUSE · +15 / s") — the end line's own layout (CC2).

## Tests (local, the Beelink — the final run, nothing else busy)
- Unit 1930 / 1930 (+ tests/dfix5.test.mjs). `/api` on the emulators: rules 82 · server 57 · progression 10 · daily-module 22 · password 10 ·
  coastclear 16 · daily-drop 14 · friends 8 — all green.
- Browser: smoke 8 / 8 · e2e-coastclear 41 / 41 (the dig p50 13 · p95 18 ms; the server 2 ms — load 0 · tx 1) · e2e-password 40 / 40 · e2e-daily
  92 / 92 · e2e-drop 53 / 53 · the harbor `vault` group 58 / 58 (the slim strip changed). The full harbor suite runs in the cloud (THE LOCAL
  TESTING RULE) — this pass touched no City 2.0 file, so the push carries the ci tag.
- (A note for the next pass: the `/api` suites wipe the day's data + THE DAILY SECRET — restart `serve.mjs` before the daily E2Es, or its memo
  serves the old board: a first e2e-coastclear run after them went red on that alone, green after the restart.)
