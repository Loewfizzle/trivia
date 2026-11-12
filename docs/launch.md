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
8. **Tell people.** The links: https://www.neonspeakeasy.com (the city) · https://www.neonspeakeasy.com/board (THE BOARD — its link preview
   is the velvet board since FR7 FIXES B).
9. **The weekly watch** (five numbers, Mondays): Vercel → Usage → **Edge Requests** + **Fast Data Transfer**; Firebase → Realtime Database →
   Usage → **peak connections** (the free line is 100) · **downloads** · **storage**; GitHub → the repo's size (Settings → the top) while
   public. FR7 FIXES B's estimate for a month of 20 friends daily + 4 Fridays: see "THE EDGE REQUESTS" in
   `docs/harbor/passes/fr7-fixes-b.md`.

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

(filled in Group 4 — see below)
