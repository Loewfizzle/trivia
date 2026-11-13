# THE LAUNCH + THE PRIVATE FLIP — the owner's steps

Written in FR7 FIXES B (Nov 12 2026) from FR7-A's LAUNCH CHECKLIST (`docs/harbor/review-7a.md`) and the owner's split (plan.md "OWNER'S
NOTES — NOV 12 (afternoon)"): **THE LAUNCH** comes first and the repo stays PUBLIC; **THE PRIVATE FLIP** comes later, only once people are
really coming. Nothing here was run by a pass — every step is a tap or a command for the owner. Anti-cheat never depends on the code
being secret (the server checks + replays every result), so nothing in THE LAUNCH waits on THE PRIVATE FLIP.

What the code already does for you (FR7 FIXES A + B): the reset stamps THE RESET EPOCH (a back-fill pressed later never brings old wins
back), carries every freeze a player holds into their new streak, clears COUNTED PLAYS (a veteran is listed on the boards again after 3
counted plays, like everyone), and gives FOUNDING MEMBER to nobody new once the window is closed.

## 1. THE LAUNCH (the phone + /admin — ~15 minutes)

Pick a morning: the reset goes **just after 4 am Eastern** (the streak day turns at 4 am — a reset mid-day wipes a half-done day's
sweep) and **with no room live**.

1. **The day before — clean up (optional).** /admin → **Test players** → FROM THE FIRST → review the pre-ticked rows (test-looking names,
   no nights played) → PREVIEW → CONFIRM. Nothing is removed without CONFIRM. (Real friends are never pre-ticked by a 0-nights rule alone.)
2. **Just after 4 am Eastern — check nobody is in a room.** The radio's LEDGER (in the city) shows ROOMS OPEN; it should read 0. If a room
   is open, wait.
3. **The dry run.** /admin → **Progress reset** → PREVIEW. Read the line — "N profiles · X XP · … · N counted plays will be reset; 0 items
   removed". The last part must say **0 items removed**. Nothing is written by PREVIEW.
4. **The reset.** Type `RESET` → CONFIRM (a second tap). It answers "Done. … Backup b…; N FOUNDING MEMBER cards given first." **Write the
   backup stamp down** (b + a long number) — /admin → Progress reset → Backups → RESTORE takes everything back if something looks wrong.
   While the founder window is still open the reset first gives FOUNDING MEMBER to every player who already played — that is the point
   of doing step 5 AFTER this.
5. **Close FOUNDING MEMBER — before you tell anyone.** In the city: the radio → THE LEDGER (the right face) → FOUNDER WINDOW → CLOSE (a
   second tap confirms). Closing sweeps everyone who already played one last time, then nobody new can get the card. (While it is open,
   ANY first counted match grants it — so it must be closed before strangers play.)
6. **Check (on your phone, a fresh tab):**
   - YOUR CARD: LEVEL 1, your cards + emblems + glows still owned and still worn; your member Nº unchanged; FOUNDING MEMBER still yours.
   - Your streak: 0 days, but the freezes you held are still there (the streak card).
   - THE BOARD (`/board`): every tab empty ("be the first") — the XP board, DAILIES, OVERCLOCK, PRISM, HOLD'EM.
   - The radio's LEDGER: FOUNDER WINDOW closed, the holders' count.
   - (/admin → **The boards** → PREVIEW is now safe to press at any time — THE RESET EPOCH: it only rebuilds from after the reset. It isn't
     needed.)
7. **Known after the reset:** the "X% of players have this" line on an item reads high for a while (the player count starts again from
   zero, the item counts don't) — it settles as people play. A player's level rewards are never granted twice on the re-climb.
8. **THE EDGE CACHE — ✅ DONE EARLY (THE CDN HOTFIX, Nov 12, the same evening):** Vercel's dashboard showed the free plan's edge requests at
   **1M / 1M** (a Hobby account over a limit can be PAUSED), so the step below ran at once instead of at the launch: the revert of "THE EDGE CACHE
   out" (the worker's ONE COPY PER DEPLOY + the 5-min edge header on /js /css /assets — the two-tab bounds kept) + the city's idle polls cut (the
   preview / radio feed `GET /api/admin?live=1` 45 s → 5 min, `radioHello` ~2 → ~5 min, both only from a tab on screen AND focused; the NIXIE's
   window 3 → 6 min, the sightings' city-open trail 150 → 360 s to match). The trade the owner accepted for the launch is live now: a phone
   that had the site open in the last 5 min may see the previous deploy's files ONCE on his iPhone check (a second open shows the new one).
   Nothing left to do here at the launch. (The original text, kept for the record:) FR7-A's D2; the owner, Nov 12: deferred until he stops
   checking every deploy on his iPhone the moment it lands — every repeat visit re-asked Vercel for every file, each one an edge request.
   The pass did exactly this:
   - **The code — already written + proven, then taken out (FR7 FIXES B):** `git log --oneline --grep "THE EDGE CACHE out"` names ONE commit;
     `git revert <that sha>` puts it back as it was:
     - `vercel.json`: `/js/(.*)`, `/css/(.*)`, `/assets/(.*)` → `Cache-Control: public, max-age=300, stale-while-revalidate=86400` (the HTML,
       `sw.js`, `/api`, `/audio`, `/data` untouched);
     - `sw.js` — ONE COPY PER DEPLOY: on every page load the worker asks `/api/time` for the build id (`v` — the commit, the same number THE SKEW
       WRAPPER reads); the SAME build as the copies it holds → every static file from its own copy (no request leaves the phone); a NEW build →
       a fresh cache named `na-b-<v>`, every file from the network (`cache: 'no-cache'` — never the HTTP cache, so a copy is only ever the
       network's, in its own build) + kept, the old build's cache dropped; NO build id (localhost, a slow / dead `/api/time`) → exactly as today.
       A copy is handed to the page `no-cache` (WebKit's memory cache then asks the worker again — never an older deploy's module). Every Cache
       Storage wait bounded (0.8 s → the network).
     - The trade the owner accepts at launch: a phone that had the site open in the last 5 min may see the previous deploy's files once
       (only a page the worker doesn't control yet — the worker itself switches at the next page load).
   - **The proof to run (local, the emulators):** `node tests/integration/wk-edge.mjs` 6 / 6 (cold · the worker's first load · WARM ≤ 10 static
     requests · a DEPLOY: the new code at once, no mixed graph · one build cache); `node tests/integration/wk-twotabs.mjs` 7 / 7;
     `node tests/integration/sw-cache.mjs` 3 / 3; `ONLY=load` (the `load` group); `wk-load.mjs`, `wk-double.mjs`, `boot-time.mjs` (no regression);
     `e2e-conn.mjs`; the unit test that pins it (bring back FR7 FIXES B's "D2 — THE EDGE CACHE" + "D2 — the worker" cases — in the same revert).
   - **The numbers (measured in FR7 FIXES B with that code, WebKit, each visit a new tab):** TODAY a cold visit 375 requests / 7.5 MB, a WARM
     visit **356 / 7.2 MB**; WITH IT a warm visit **15 (4 static + 11 /api) / 260 KB**, the first visit after a deploy 357 (the refill); on the live
     site (Nov 12, the few hours it was deployed) a warm visit reached the edge ~8 times. The month at FR7-A's yardstick: ~61 % of Vercel's free
     million → ~12–35 %.
9. **Tell people.** The links: https://www.neonspeakeasy.com (the city) · https://www.neonspeakeasy.com/board (THE BOARD — its link preview
   is the velvet board since FR7 FIXES B).
10. **The weekly watch** (five numbers, Mondays): Vercel → Usage → **Edge Requests** + **Fast Data Transfer**; Firebase → Realtime Database →
   Usage → **peak connections** (the free line is 100) · **downloads** · **storage**; GitHub → the repo's size (Settings → the top) while
   public. The edge requests before vs with THE EDGE CACHE (step 8, live since THE CDN HOTFIX): FR7 FIXES B's numbers in
   `docs/harbor/passes/fr7-fixes-b.md` + the hotfix's in ROADMAP / `docs/roadmap-history.md` "THE CDN HOTFIX".

## 2. THE PRIVATE FLIP (later — the PC + GitHub + /admin — ~1 hour)

Only once people are really coming. Order matters: the rewrite first (while nobody else has a clone that matters), then the flip, then
THE RESEED.

1. **Before anything — confirm in Vercel** (Settings → Environment Variables): `KEY_PEPPER` **is set**. If it isn't, NEVER rotate the
   service-account key (the pepper is derived from it — a new key would break every restore key and every board id). Don't change it.
2. **Archive the pass screenshots** (they leave the repo's history; you keep them on the PC). In PowerShell, from the repo:
   ```powershell
   robocopy docs "$HOME\Downloads\NEON\pass-shots\docs" *.png *.jpg *.jpeg *.webp *.gif /S
   robocopy screenshots "$HOME\Downloads\NEON\pass-shots\screenshots" /S
   ```
3. **A full backup of the repo as it is** (every commit — the way back if anything goes wrong):
   ```bash
   cd ~/Documents && git clone --mirror https://github.com/Loewfizzle/trivia.git trivia-backup-before-flip.git
   ```
4. **The rewrite, in a FRESH clone** (never in the working folder). Needs `git filter-repo` once: `pip install git-filter-repo`.
   ```bash
   cd ~/Documents && git clone https://github.com/Loewfizzle/trivia.git trivia-flip && cd trivia-flip
   git count-objects -vH                      # the size BEFORE (Nov 12: pack 450 MiB + 152 MiB loose locally; GitHub said 573,690 KB)
   # the old versions of big files no commit at the tip uses (old songs, old art, old bakes) — their ids:
   git rev-list --objects --all | git cat-file --batch-check='%(objecttype) %(objectname) %(objectsize)' | awk '$1=="blob" && $3>102400 {print $2}' | sort -u > ../big.txt
   git ls-tree -r HEAD | awk '{print $3}' | sort -u > ../tip.txt
   comm -23 ../big.txt ../tip.txt > ../strip-ids.txt
   # KEEPS: every file at the tip except the pass screenshots; every commit + message (rewritten ids). DROPS: every screenshot under docs/
   # and screenshots/ (all versions — archived in step 2) + the old versions listed above
   git filter-repo --strip-blobs-with-ids ../strip-ids.txt --invert-paths --path screenshots/ --path-regex '^docs/.*\.(png|jpe?g|webp|gif)$'
   git gc --prune=now --aggressive
   git count-objects -vH                      # the size AFTER (estimated Nov 12: ~300 MB — the shipped music, ~253 MB, is most of what remains)
   ```
   Then check the tip still works: `node --test tests/*.test.mjs` (the unit suite) in `trivia-flip`.
5. **Put it on GitHub** (filter-repo removes the `origin` remote on purpose):
   ```bash
   git remote add origin https://github.com/Loewfizzle/trivia.git
   git push --force --all origin && git push --force --tags origin
   ```
   Then retire the old working folder: rename `Documents\trivia` → `trivia-old`, and clone again: `git clone https://github.com/Loewfizzle/trivia.git trivia`
   (an old clone pushed again would bring the whole history back). Copy `.claude\settings.local.json` and any `*.local.txt` across by hand.
6. **Flip the repo:** GitHub → the repo → Settings → General → Danger Zone → **Change visibility → Private**.
7. **At once, prove Vercel still deploys:** push one small commit with the deploy tag in its message and watch Vercel → Deployments build
   it. (Hobby checks that a private repo's commit author has access — every commit is yours; the Co-Authored-By lines are untested.) If it
   is BLOCKED: Vercel → Settings → Git → reconnect the repo.
8. **The workflows switch themselves** (FR7 FIXES B — THE PRIVATE-REPO WORKFLOW): once private, a pass's final push runs only the light
   tests workflow; the cloud Harbor run is skipped (the full Harbor suite already runs on the mini PC before every final push).
   `gh workflow run harbor` still runs it by hand. Check the first final push: `gh run list` shows tests ran, harbor skipped.
9. **THE RESEED:** /admin → **The dailies** → RESEED · PREVIEW (read the plan, nothing written) → RESEED NOW (a second tap). Fresh daily
   answers from the next 4 am Eastern; today's run and every past result untouched. (Before OVERCLOCK's daily is ever switched on: its
   reserve's salt changes + a rebuild — its picks were public.)
10. **Check:** the site loads (nothing on it reads from GitHub); `/board` + the city as usual; the next morning's dailies play; GitHub →
    Settings → Billing → Actions minutes after the first week (the estimate is below).

## THE REPO's GROWTH RULE (D4 — from FR7 FIXES B)

**Measured Nov 12:** GitHub says the repo is **573,690 KB (~560 MiB)**; the local clone after `git gc` packs to **549 MiB**. What it is made of
(every version ever committed): the music ~307 MB (most of it the songs at the tip — ~253 MB), pictures ~173 MB PNG + 15 MB JPEG (the pass
screenshots under `docs/` ~112 MB of it, `screenshots/` ~50 MB), the docs' text ~40 MB, the 3D models ~20 MB. It grew ~20 MB a day in
the last two weeks — mostly pass screenshots. GitHub's recommended line is 1 GB.

**THE RULE (from FR7 FIXES B on):**
1. **A pass's screenshots stay on the PC.** `.gitignore` keeps every picture under `docs/harbor/passes/`, `docs/games/` and
   `screenshots/` out of git (a pass still shoots into its folder or `./shots-review/` — `shots.mjs`'s default — and the files stay there
   for the owner; nothing there is committed). `tests/repo-growth.test.mjs` fails on a new big one.
2. **A picture a doc must carry** (rare — the owner's mocks under `docs/harbor/refs/`, a card's art) = a JPEG at 1×, ≤ 150 KB, added on
   purpose (`git add -f`) and named in the pass log.
3. **Music is the rest of the size** — each new song adds its ~3 MB to the history forever (a replaced song: its old version stays too).
   Replace a song only when it matters; the history rewrite at THE PRIVATE FLIP drops the old versions.
4. **The history rewrite** waits for THE PRIVATE FLIP (above): it drops every committed screenshot + the old versions of big files —
   estimated ~560 → ~300 MB on GitHub.

**THE DEPLOY'S SIZE (D3):** `node scripts/deploy-size.mjs` — **299.1 → 232.5 MiB** (1,612 → 1,583 files) once the ten frozen games' songs
left the deploys (`.vercelignore` — they come back with their game; `tests/frozen-songs.test.mjs`).
**Vercel → Settings → Deployment Retention** (the owner sets it — a pass can't see it): at ~10 tagged deploys a day × 232 MiB, the 10 GB
of deployment storage holds ~4 days of deploys if nothing is pruned. Set **Canceled**, **Errored** and **Pre-Production** to the shortest
time offered, and **Production** to about a week (enough to roll back; Vercel always keeps the current one).

## THE MINUTES ONCE PRIVATE (D1 — from FR7 FIXES B)

The owner's decision: NO self-hosted runner. The two workflows read the repo's own visibility (`github.event.repository.private`), so the
switch happens BY ITSELF at the flip — nothing to edit:
- **PUBLIC (now):** exactly as before — a pass's final push runs `tests` (either tag) + `harbor` (the harbor tag). Public minutes are free.
- **PRIVATE:** a final push runs ONLY the light `tests` workflow (unit → rules → /api → smoke; CONN + presence skipped — they run on the mini
  PC). `harbor` never runs on a push (its ~125 billed minutes a run would eat the month in a few days); the full Harbor suite runs locally
  before every final push, as it does now. `gh workflow run harbor` still runs it by hand (~125 minutes — only when it's worth it).

**The estimate (measured Nov 12):** a `tests` run bills **~11 minutes** (two jobs: unit 3.5 min + rules / /api / smoke 6 min, each rounded up;
FR7 FIXES B's four more /api suites add about a minute, the skipped CONN + presence take about one off). A private Free repo gets **2,000
minutes a month** → **~180 runs ≈ 6 final pushes a day**. The pace of Nov 8–12 was 6–11 full runs a day (two or three passes a day, each with
an early deploy) = **~2,000–3,600 a month — over the line at that pace.** After the flip: one tagged final push per pass (the early hotfix
pushes with the deploy tag only — they run nothing), and ≤ 5 a day stays inside (~1,650). GitHub → Settings → Billing → Actions shows the
month so far.
