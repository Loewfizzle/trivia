# FR7 FIXES C2 — THE LEDGER WON'T OPEN + THE LEAVES READ AS LEAVES + THE JAYWALK POSTER + THE TWO CLOUD REDS + THE SUPPORTED FLOOR (Nov 13 2026)

The owner's notes: plan.md "OWNER'S NOTES — NOV 13 7 am (FR7 FIXES C live on his iPhone)" (+ decisions.md). On the beelink. **No database rules
change.** Still 8 functions. Each group committed on its own; ONE deployment (the final push's top commit carries the harbor tag).

## Step 0
plan.md's notes appended unchanged + the BUILD TABLE line; decisions.md: the current line, THE LEAVES READ AS LEAVES + A FACE THAT READS — `fb3fcf3c`.

## Group 1 — THE LEDGER STUCK ON "Tuning in…" (`53b1e449`)

- **The cause, reproduced in WebKit** (Playwright's WebKit as an iPhone, an owner session on the emulators): the shipped code opens fine on a
  clean load — but a page holding the PREVIOUS deploy's `music.js` (no `musicFileOf`, FR7 FIXES C's one new export) lazily imports the new
  `radio-ledger.js` → `now-playing.js` → `import { musicFileOf } from './music.js'` → **"SyntaxError: Importing binding name 'musicFileOf' is not
  found"**: the whole LEDGER module fails to link, `radio.js#face()` only `console.warn`ed it → "Tuning in…" forever. The same deploy id (the page
  + /api/time agree) → THE SKEW WRAPPER rightly doesn't reload. How the owner's phone held an older `music.js` can't be read back (the face never
  reported — that was the gap); the likely path is the edge header's stale-while-revalidate on `/js/*` (max-age 300, SWR 1 day) on a load the
  service worker didn't control. /admin: no report could exist (console.warn only) — fixed below.
- **The fix — NOW PLAYING can't break the LEDGER:** `js/audio/now-playing.js` imports NOTHING; each player registers its reader on ONE hub
  (`globalThis.__nsNowPlaying` — music.js: `off` + `music`; party-music.js: `party`; lobby-music.js: `lobby`); a player that never registered =
  "NOW PLAYING · —". `nowPlayingText()` never throws; the LEDGER's paint + its 1-s tick are wrapped.
- **The face loader** (`radio.js`): a face whose import OR paint fails shows **"Couldn't open the ledger — TAP TO RETRY"** (one tap = one fresh import,
  `?again=N` past the module map's cached failure) and REPORTS to /admin (`errlog.js#reportError`, label `radio-ledger` / `radio-program`). Same for PROGRAM.
- **The guard:** the harbor `radio` group — a phone holding a STALE `music.js` (served by interception) + THE PROGRAM's first fetch a 503: "Couldn't
  open the program — TAP TO RETRY" + reported; the retry → THE PROGRAM; DESK · PROGRAM · LEDGER each paint their real content ≤ 3 s (the LEDGER: the
  nixies + NOW PLAYING + TODAY) — 54 / 54. **WebKit:** `tests/integration/wk-radio-faces.mjs` (plain + stale): the fixed tree 8 / 8; **the shipped
  build (`be8c156c`, a worktree on :5174) FAILS** — `stale: LEDGER … still "Tuning in…"` + `[radio] ledger SyntaxError: Importing binding name
  'musicFileOf' is not found.` Unit: `tests/now-playing.test.mjs` (imports nothing; the LEDGER imports no player; the hub's order; never throws).

## Group 2 — THE LEAVES READ AS LEAVES (`9d990c72`)

| | FR7 FIXES C | now |
| --- | --- | --- |
| leaves (full bank) | 92 | **27** |
| size at 390 | ~24–42 pt | **40–58 pt** (52–70 logo units; 0.833 pt a unit at 390 — measured) |
| overlap | dense — most leaves mostly covered | each ≤ **30 %** covered (`MAX_COVER`) |
| where | a dense oval, most INSIDE the letters | a **RING** round + behind the letters: above, below (clear of SPEAKEASY), the gaps, past both N's — ≤ 45 % of each inside a letter's box, mean ~25 % |
| night colour | multiplied to a deep red-brown far from the tubes (floor 0.30 / 0.16 / 0.10) + dark overlap shadows | the **real colours** lit warm — the far floor 0.66 / 0.56 / 0.46 (~58 % of daylight), the layer ≥ 72 % opaque, lighter shadows |
| the halo | stepped dark strokes (read as brown outlines) | a **smooth** baked blur (shadow passes) — 0.95 gold week · 0.4 pink nights · 0.6 day |
| build-up | centre-out, ~11 a day | centre-out, ~3–4 a day (Nov 15 → 22) |

- **Contrast, measured** (WCAG luminance — the tube cores vs the median of what sits 5–14 pt beside them, 390 / 402 / 430): GOLD NIGHT with the bank
  **4.70 / 4.68 / 4.67 : 1** (the same scene without the bank 5.6; a plain pink night 4.4–5.2); PINK build-up nights 4.5–5.2; DAY **4.82 / 4.51 / 4.81**
  (a plain day 4.0–4.3). The first ring with the old halo measured 3.4 at night → two refines of the halo (`fr7-fixes-c2/contrast/r3…r6-390.png`).
- **Look reviews** (`docs/harbor/passes/fr7-fixes-c2/` — git-ignored): `leaves-before/` (the shipped bank) → `leaves-r1/` (the ring: the top leaves hit
  the corner row → `CEIL_Y`, a tighter ring) → `leaves-r2/` (the Nov 18 pink night too dark: the layer opacity + the pink halo) → **`leaves-final/sheet-390
  / 402 / 430.png`** (the force night + day, Nov 18, Nov 24 night + day, Nov 26 night, unzoomed, with the iPhone's safe areas). The owner's test — "can
  you tell they're leaves at a glance?" — yes at all three sizes, night and day.
- Proof: `tests/leafbank.test.mjs` (the count, the size in pt, the overlap, the ring, SPEAKEASY + the corner row, centre-out, the night floor) +
  the harbor `thanks` + `holiday` groups 44 / 44.

## Group 3 — THE JAYWALK POSTER: A FACE THAT READS (`d830c511`)

- **The face:** BOWLBY ONE (Google Fonts, OFL — eight heavy faces compared at the board's size: `fr7-fixes-c2/jw-fonts.png`; Bowlby One has the
  tallest caps for its width + no thin strokes), path data from `scripts/build-jaywalk-billboard.mjs` (the art rebuilt byte-identical), for JAYWALK
  AND the band. JAYWALK ~94 % of the box, white-hot with a hot-pink edge + a THICK dark outline + a drop — no glow blur.
- **A CALM PANEL:** a solid dark band across the poster's top to just under the word, a fine pink rule under it; the art drawn BELOW it (`ART_DROP`
  0.08 of the panel — the kid's cap + face + the headlights under the panel, never behind the word).
- **The caps on the live board** (the harbor `trivision` group, 7 / 7): 390 — JAYWALK 10.4 ≥ HOLD'EM 10.3 pt, COMING SOON 6.2 ≥ NOW OPEN 5.9; 402 —
  10.8 ≥ 10.6, 6.4 ≥ 6.1; 430 — ≥ as well. `tests/trivision.test.mjs` 9 / 9.
- **Shots:** `fr7-fixes-c2/jw-r2/side-by-side.png` (HOLD'EM | JAYWALK, night + day × 390 / 402 / 430, unzoomed) + `jw-turn-sheet.png` (a cast of one turn
  JAYWALK → HOLD'EM, every 18th painted frame — it reads even in the 1× cast). **The verdict at 390: JAYWALK reads at a glance** (white letters,
  black outline, on black — like HOLD'EM's). The kid's picture is a smaller strip now (the panel took the top); if the owner wants more of the kid,
  that's the fully redrawn poster.

## Group 4 — THE TWO CLOUD REDS

1. **`one-day-line.test.mjs` couldn't load in the cloud** (`a510c39c`): it imported `needsRetry` / `mergeOutcomes` from `api/_lib/stats.js` → `fb.js` →
   `firebase-admin` (the unit job installs no root node_modules). They moved to the PURE `api/_lib/retry.js` (stats.js re-exports them). **Checked:**
   the whole unit suite with the root `node_modules` renamed away — green (1767 / 1767 once `wk-radio-faces.mjs` went through the live-site guard, which
   that run caught).
2. **NO TWO CAMERAS at the hours return** (`553bcac8`). **Not the sunset:** the two cloud reds landed at 12:12 and 16:40 Grand Rapids time (the run at
   02:12 / 06:40 + 10 h); the common factor is THE TRI-VISION, live from Nov 12 (Nov 11 — before it — never fails). The new path **`hours-dusk@HH:MM`**
   (`kit/two-cameras.mjs` — hours-box with the clock set so the +10 h lands at HH:MM on Nov 13) reproduced it at once: the shipped build red at 16:40 +
   17:20 (Chromium 4 / 4, `cr-double.mjs`; WebKit 2 / 2, `wk-double.mjs`). **The cause** (the crisp-less twin of the red look — `boardCrisp()`): the crisp
   roof poster drew the bake STARTED (`baker.key` / `bakeTones` / the live `TW`) while the city's canvas still showed the one LANDED — a day poster over
   the lamp-lit night board for the whole re-bake. Before the tri-vision a return rebuilt the board, and the fresh-board gate hid the crisp poster
   meanwhile; with it the face stays, nothing hid it. **The fix:** the crisp copies of the city's lettering (the roof poster, the date stone, the
   blade) follow the bake ON SCREEN — `shownKey` + `liveTones` + `liveTW`, set where a bake lands — and the fresh-board gate asks the landed bake.
   **The check, not loosened:** a look waits out the board's OWN 0.9-s dissolve (a hint's spell ending — seen at hours-dusk@12:12: STREET PARTY's
   copy fading out over HOLD'EM) and a tri-vision turn — both deliberate copies; every frame is still judged. **After:** Chromium 10 / 10 (12:12,
   16:40, 17:20, hours-box, hours × 2); WebKit 4 / 4; the harbor `cameras` group with `hours-dusk@16:40` added. A pre-existing local flake noted:
   `no-observer-pre` in the group (three pages at a time) ~1 run in 3 on both trees, green alone 8 / 8.

## THE ADD-ON — THE SUPPORTED FLOOR + THE HAND RELOAD (the owner's /admin, Nov 13)

The owner: the 2 BOOT HANGs at 5:54 am are a bot — "Mac Chrome 83" (2020) on macOS 10.14, an 800×600 @1 window, app.js failing in 7 ms; and his
own iPhone hang this morning sent no report (he reloaded before 12 s).
- **THE FLOOR** = Chrome 92 · Firefox 90 · Safari / iOS 16 (`js/core/browser-floor.js` + the inline ES5 twin in index.html's watchdog — one UA table
  through both in `tests/safari-floor.test.mjs`: the bot old; Chrome 91 old, 92 not; iOS 15.8 old, 16.0 not; Chrome / Facebook on iOS by the iOS
  version; an iPad asking for the desktop site; Mac Safari 15.6 old, 17.5 not; Firefox 89 / 132; Android Chrome, Samsung Internet, Edge; `curl` unknown
  → never old). Below it: the boot screen's plain "This browser is too old for NEON SPEAKEASY — try a current Safari or Chrome." (`bootfloor-old-800x600.png`
  in the harbor shots), app.js stops at its top, no reload / TAP TO TRY AGAIN, **no BOOT HANG** — one `old` note → `logstats/old` → /admin STATS'
  quiet line "old browsers: n · last … — below the supported floor (Chrome 92 · Firefox 90 · Safari / iOS 16): shown “too old”, never a BOOT HANG".
  The server also counts (never stores) a `boot` report from a below-floor UA. Preview: `?oldua=<UA>`.
- **THE HAND RELOAD:** `ns:boot-last` in sessionStorage (each stage, every second, the snapshot every 5 s + at `pagehide`); the next boot sends ONE
  "THE LAST BOOT DIDN'T FINISH — reloaded (or left) by hand at n s on screen (… s after it began), stage …" + the snapshot (≥ 4 s on screen; none after
  a reveal or after the watchdog's own report + reload).
- **Proof:** the harbor `bootfloor` group 4 / 4 (the bot's UA past 12 s; a boot held 5.8 s on screen at stage html, reloaded by hand → the report once);
  `server.test` "old browsers: counted on one line, never a BOOT HANG; a current browser still reports"; `tests/boot-watchdog.test.mjs` — **every inline
  script parses** (an edit script slipped a real newline into the hand-reload string — the page's whole watchdog would have died; caught by the
  e2e, guarded now).

## The close — local runs (the beelink, my own servers: fresh emulators + `serve.mjs --emu` on :5173; a worktree of `be8c156c` on :5174 for the BEFORE runs)

| suite | result |
| --- | --- |
| unit `node --test tests/*.test.mjs` | 1770 / 1770 (+ `now-playing`, `leafbank`, the floor + every-inline-script-parses); once with the root node_modules hidden — green |
| rules `rules.test.mjs` | 82 / 82 (no rules change) |
| `/api` `server.test.mjs` | 54 / 54 (+ "old browsers") — one run went red on THE RADIO while the stopped full harbor run's shards were still alive on the emulators (killed; green after) |
| smoke | 8 / 8 |
| harbor groups touched | radio 54 / 54 · thanks + holiday 44 / 44 · trivision 7 / 7 · cameras 13 / 13 (twice; see the flake above) · bootfloor 4 / 4 · music 110 / 110 (alone) |
| **FULL `e2e-harbor`** (4 shards + the tails, ~35 min, nothing else busy) | **1289 / 1292** + the `music` group stopped on a puppeteer protocol timeout (alone: 110 / 110). The three reds: THE ROOM's OWN COST at 4× CPU (45 → 49.9 ms — the known timing red of the last passes, nothing of this pass in its frame); `no-observer-pre` (the known group flake above); **NIGHT-C A REAL ZEBRA** (the `people` group: 4 bars, not 5) — **PRE-EXISTING: the shipped `be8c156c` fails it the same way today** (a worktree on :5174, ONLY=people: "4 / 4 / 4 / 5 with gaps 5 / 3 / 3"); it passed in FR7 FIXES C's run, so something time-of-day / date dependent reaches the crossing's probe — left for its own look, not touched here. |

The cloud: the harbor tag on the final push's top commit (one deployment). All my servers stopped at the end (the emulators, `serve.mjs` :5173, the
:5174 worktree — removed); the owner’s :5190 preview left running.
