# CITY E — THE BOARD's new look, the tappable share card, the Lab, the full card's text panel, THE NIGHTLY BACKUP (Nov 15 2026, the mini PC)

The owner's order (`docs/harbor/decisions.md`): … CITY D ✅ → **CITY E** → THE MAINTENANCE REVIEW → JAYWALK → THE GIRL CARDS → THE TOWER MOVE → the
reset. **No rules change** — every new node is server-only under the rules' default deny (`shr/ shrx/ shrp/` the share cards, `progress/backup/`
the pickups). 8 functions (the share card rides `api/daily.js`, the backup `api/admin.js`). No add-on arrived in the inbox during the pass.

**Step 0** — `decisions.md` (a CITY E bullet: THE BOARD's look, the tappable share card, THE NIGHTLY BACKUP, THE LAB FEEDS EVERY PASS, /admin + STATS
stills are fine, the roof board's shared clock) + `plan.md` "OWNER'S NOTES — NOV 15 (CITY E's Step 0)".

## Group 0 — THE LAB's MARKS
`node scripts/lab-export.mjs https://www.neonspeakeasy.com` (a GET — nothing written) → `docs/vault-lab-marks.md` (222 marks). **Open FIX marks: 2** —
#206 ZA DOMOVINU · FULL CARD (the chequered flag + "Change the name of the card to Mostarac") and #208 HORSESHOE ("looks like a donut") — built in
Group 2. PLAYER ONE: no change (its marks read APPROVE; the prompt's stray FIX). **CUT marks: none.** CLAUDE.md gained THE LAB FEEDS EVERY PASS (its
detail: `docs/vault.md` THE LAB 2.0).

## Group 1 — THE BOARD (board.html + the app's board — one view, `js/board/view.js`)
- **THE NEON TABS** (`js/ui/neon-tabs.js` — ONE builder; css/components.css "THE NEON TABS"): the games (XP · DAILIES · OVERCLOCK · PRISM · HOLD'EM),
  RECORDS · CAREER, THIS WEEK · ALL TIME and a tab's boards (one sideways row) are neon-underline tabs — the words on the night, the chosen one pink
  over its glowing line (static). The STATS sheet + /admin's stats (`js/admin/stats-view.js#tabs`, the WHO tabs) use the SAME builder — CITY D's
  sheet-only CSS moved into it; /admin's gold pill tabs are gone. Built once, set in place (THE TAP WATCH — `wk-board-taps.mjs` 20 / 20).
- **No pill, no gold anywhere on THE BOARD:** PLAY NOW (the public page's ONE pink MAIN), SHOW ALL, TRY AGAIN = THE NEON TUBE (`tubeButton`); the
  card's gold frame + glows → a cool hairline + a pink top line; the title's glow pink; the kicker + the sub-line's diamonds pink.
- **YOU** = a glowing left edge (a static 3-pt neon line + a faint pink wash from the left; the word YOU in neon — no badge). **•••** = a bare icon (no
  plate), its tap area 44 × 44.
- **THE BACKGROUND** = the REAL night harbor skyline baked from the city: `shots.mjs --preview --city 2 --sizes 430x932 --dsf 3 --idle --scenes
  board-sky --crop boardsky --webp 72` (the new scene: a clear June Tuesday 11:20 pm — no holiday, no party, no show — `force=no-people,no-legend`,
  act `bare` = every page layer hidden but the city's canvases; the crop = from under the logo's sign to the far quay) → `assets/board-sky.webp`
  (1290 × 1251, **72 KB**, in THE CARRY). Darkened (opacity 0.56) + faded (a mask) so it glows behind the title and is GONE before the tabs: the tab
  labels' worst case **5.3 : 1** at 390, **8.5 : 1** at 1440 (sampled from the shots). A wide screen shows a column-width skyline, its sides faded.
- Shots (`C:\Users\benja\Downloads\NEON\city-e\`): `board-week-*` (YOU #5 pinned) + `board-alltime-*` (YOU #3 in the list) at 390 / 402 / 430 /
  1440, `board-public-dailies-*` (390 + 1440) — 40 players. Refine passes: (1) the skyline sat behind the tabs (labels unreadable over JAY WALK /
  OVER CLOCK) → faded out above them; (2) the desktop fade by pixels (the 1440 tabs were 2.0 : 1).

## Group 2 — THE LAB ITEMS (LAB_V bumped + their LAB_CHANGES lines)
- **#206 → MOSTARAC** (the owner's note renamed it; the name server-only — `api/_lib/catalog.js` + `lab-text.js`): the chequered flag painted out
  (the flag's own blue carried in), **the Stari Most** drawn in its place (`scripts/build-card-pass-art.py#stari_most` — ONE tall, slender arch (span
  220, rise 122), the humped walkway, the two towers, a bold dark silhouette against a warm sunset glow, the arch's underside lit gold: the one
  accent), placed between MEMBER Nº and the card's name so the name sits on the right bank + tower; the flag-ripple layer → a river shimmer. Its slim
  card now has its OWN strip (`zadomovinu-strip.webp`: the flag strip + a small bridge left of him, the subject well right) — the STARI MOST card keeps
  the shared one. `ONLY=<arts> python scripts/build-card-pass-art.py` rebuilds one card's art. Four refine passes (the bridge was hidden behind the
  name's glass, then too dim, then too small).
- **#208 HORSESHOE**: a clear U — a wide open gap (the inner arms 18 apart), straight arms, FLARED heels, the round toe, eight nail holes along both
  arms (`emblem-art.js#SHOE`).
- THE STRIP MATCH: `strip-match.mjs --only card-gift-zadomovinu,card-gift-starimost` ok at 402 + 390; the code-drawn stills unchanged (`--check` current —
  a picture card has no still). Shots: `lab-mostarac-390x844.png`, `lab-horseshoe-390x844.png` (MIDNIGHT + GILDED, the plate + the strip).
  `fullcard-preview.html &emb=<emblem>` = an emblem on the plate + the strip.

## Group 3 — THE TEXT PANEL HUGS THE TEXT
Every full card (`js/vault/full.js` + vault.css THE CARD TEXT STANDARD): the bottom-left block's ONE glass (the rank + both MEMBER rows, as wide as
its widest line and as tall as the gap under a short rank) → the rank wears its own glass and the MEMBER rows theirs (`.vl-fc-rows`), each trimmed to
its words + a small even pad; the art shows beside and between them. The top line, the foil line and the card's name already hugged theirs.
PROPRIETOR stays over THE SWITCHBOARD's VU meter. The block still measures whole for THE CARD LAYOUT RULE (`layout.js` reads `.vl-fc-since`).
Shots: `panel-a-390x844.png` (THE SWITCHBOARD · INFERNO with a long rank NEWCOMER + a 12-letter name · the UFO sighting card) +
`panel-b-390x844.png` (EMERALD with a short rank MADE · the GOLDEN HOUR gift · MOSTARAC).

## Group 4 — THE TAPPABLE SHARE CARD
- SHARE TODAY shares a **LINK** (+ the same line) whose link preview's picture IS the day's card. The card's PNG goes to the server while the screen
  opens (`prepShare`'s `upload` — THE CARD IS BUILT BEFORE THE TAP holds; the tap is still ONE `navigator.share({ text, url })`). A failed upload =
  the image + line share as before.
- **The real numbers decided the size:** the 1080 × 1350 PNG is 365 KB – 1 MB (night swept 1.02 MB) — over the 400 KB cap — so the preview picture is
  the card at EXACTLY half size, **540 × 675** (79 – 246 KB).
- The server (`api/_lib/share-card.js`, from `api/daily.js` — no new function, no rewrite): `POST shareCard` accepts only a player with a JUDGED finish
  (`dly/{g}/{day}/r/{pid}`) of EVERY daily the card names that day, a real PNG (magic bytes + IHDR) at exactly 540 × 675, ≤ 400 KB; **ONE card a player
  a day** (SHARE TODAY is one card for the day's dailies — a re-share replaces it); a server-made 12-character code. `GET ?s=<code>` = the page
  (og:title `<NAME> · <DAILY> · <day>` — ONE daily's name or THE DAILIES; og:image `?si=<code>`; summary_large_image; on to `/?daily=1`, which opens
  the DAILY screen once the city is up — `js/app.js`); `GET ?si=<code>` = the PNG with `s-maxage` 7 days (`immutable` — a re-share makes a new
  code). An unknown / expired code → the home (the picture → `/assets/og.jpg`), never an error page. THE DAY'S CLOSE sweeps cards past 7 days
  (`sweepShares` — once a day per warm function, no idle poll). /admin → THE DAILIES → SHARE CARDS: the live cards + DELETE (a second tap) or paste
  a link / code.
- **The request cost: ≈ 3 a share** — the upload POST (once per card build), the preview page GET, the picture GET; repeated preview fetches of
  the picture (another person, another app) are edge hits (`s-maxage`), the page edge-cached an hour.
- Tests: `tests/integration/share-card.test.mjs` (refused: no finish · a second unfinished daily · wrong size · not a PNG · too big · a closed day;
  accepted + the page + the picture's cache; a re-share replaces; /admin list + delete; the sweep) · `wk-press.mjs` + SHARE TODAY: ONE `share()` with
  the link, inside the touch's lift (user activation), no file, 0 rescues — click on + iOS's dropped click (36 / 36).

## Group 5 — THE NIGHTLY BACKUP (docs/backup.md)
- **THE EXPORT** `GET /api/admin?backup=<part>` behind `x-backup-token` = env `BACKUP_TOKEN` (constant time; no env → 404): every DURABLE node gzipped,
  its sha256 in its header (the database is live — an index of checksums read first would not match; each fetcher checks each part + writes
  `checksums.sha256`), a part over 4.2 MB split by key hash (`409 { split }` → slices), `?backup=done` → `progress/backup/{gh|pc}`. The LIVE nodes and
  the two DAILY SECRETS (`dsecret`, `dsched` — future answers stay ONLY in the database; a restore = RESEED) are left out; THE CLASSIFICATION RULE
  (`tests/backup.test.mjs`) fails on an unclassified node.
- **THE MAIN COPY:** `gh` was signed in as Loewfizzle → the PRIVATE repo **Loewfizzle/neon-backups** created (visibility checked: PRIVATE) with ONLY
  the workflow (`.github/workflows/backup.yml` ← `scripts/backup/neon-backups-workflow.yml`), `fetch.sh` and a README; its secret `BACKUP_TOKEN` set
  with `gh secret set` (from the token file — never printed). Nightly 09:30 UTC (~4:30 am ET) + a manual run; ONE artifact a night, `retention-days: 14`.
- **THE SECOND COPY:** `scripts/backup/install.ps1` RUN once on the mini PC: the token made (32 random bytes, hex) → `C:\Users\benja\NeonBackups\token.txt`
  (icacls: Ben's user only), the task "Neon Speakeasy nightly backup" registered (daily 4:45 am, start when available, network only, while Ben is
  signed in) → `fetch.ps1` (the newest 14 dated folders kept). Both fetchers tried here against the local server (a throwaway token): every checksum
  OK, the split path too (a 3 KB limit → `profiles@0of5…`); `restore-emulators.mjs` put the 400 profiles back; `--json` writes the console's files.
- **/admin → BACKUPS:** GITHUB · THE PC — the last pickup's time + size; red past 36 h.
- **THE SIZE (measured):** 4,000 seeded players + 30 days × 3 dailies + 8,000 results = **1.70 MB gz in 29 parts** (dly 1.12 MB) → **14 nights ≈ 24 MB
  = 4.8 % of a free private repo's 500 MB** artifact storage.
- Tests: `tests/backup.test.mjs` (unit) + `tests/integration/backup.test.mjs` (the door; export → wipe → restore = identical; live + secret untouched;
  a split part restored whole; THE REAL SIZE). `.gitignore` + `tests/repo-growth.test.mjs`: no backup file / folder / token can be tracked here.
- **Ben's step:** Vercel → Environment Variables → `BACKUP_TOKEN` (Production) = the token file's contents → Redeploy. Until then both copies get a
  404 (the PC's log says so) — the first real backups run the night after.

## The final local run (fresh emulators + `DAILY_TEST=1 node scripts/serve.mjs --emu`, nothing else busy)
unit **1989 / 1989** · `/api` server.test **62 / 62** · share-card **1 / 1** · backup **2 / 2** (THE REAL SIZE 1.71 MB / 29 parts) · smoke **8 / 8** ·
e2e-daily **95 / 95** · wk-press **36 / 36** · wk-board-taps **22 / 22** · harbor `vault` **58 / 58** (THE LAB 2.0's counts: 37 NEED YOU with the two
rebuilt items) · harbor `tapfit,shell` **32 / 32**. Rules not touched (no rules test needed). The full harbor suite = the cloud run on the tagged push.
Servers: the pass's emulators + :5173 stopped at the end; Ben's :5190 kept.
