# THE NIGHTLY BACKUP (CITY E — the owner, Nov 15 2026)

The players' progress lives only in Firebase (the free Spark plan — no automatic backups). Every night two copies are taken, 14 days each:

| copy | where | when | kept |
| --- | --- | --- | --- |
| **the MAIN copy (off-site)** | the PRIVATE GitHub repo **Loewfizzle/neon-backups** — each run's **artifact** `neon-backup-<date>` | ~4:30 am Eastern (09:30 UTC; GitHub may start a little late) + a manual run | 14 days (GitHub prunes it — never committed to git history) |
| **the SECOND copy** | the mini PC: `C:\Users\benja\NeonBackups\<date>\` | ~4:45 am (Windows scheduled task "Neon Speakeasy nightly backup": run as soon as possible after a missed start, only with the network up, while Ben's user is signed in) | the newest 14 folders |

**Never in the public repo (Loewfizzle/trivia):** no backup file, no token, no secret. `.gitignore` refuses `*.json.gz`, `NeonBackups/`,
`neon-backup*/`, `backups/`, `backup-token*.txt`, and `tests/repo-growth.test.mjs` fails if one is ever tracked. The service account stays
in Vercel; the backup uses its OWN token.

## How it works

- **THE EXPORT** — inside `api/admin.js` (no new function; `api/_lib/backup.js`): `GET /api/admin?backup=<part>` with the header
  `x-backup-token: <BACKUP_TOKEN>` (Vercel env — a BACKUP-ONLY token, never the owner's login, never the service account), compared in
  constant time. No `BACKUP_TOKEN` in the env → **404** (the door isn't there); a wrong / missing header → 401.
  - `?backup=index` → `{ v, at, parts: [node…], left: { live, secret } }` (plain JSON)
  - `?backup=<node>` → that node as **gzipped JSON** + `x-backup-sha256` (the body's sha256) + `x-backup-bytes`
  - a node whose gzip is over `PART_MAX` (4.2 MB — Vercel answers at most 4.5 MB) → **409 `{ split: k }`** → `?backup=<node>&slice=i/k` for
    i < k: its children by a stable hash of their key (fnv1a % k), each under the limit
  - `?backup=done` (+ `x-backup-who: gh | pc`, `x-backup-bytes`, `x-backup-parts`) → `progress/backup/{who} = { at, bytes, parts }` (server
    only — no rules change) → **/admin → BACKUPS** (each copy's last pickup, its time + size; RED past 36 h)
- **THE CHECKSUMS** — each part's sha256 travels WITH that part (its header): the database is live, so an index computed first would not match
  parts read seconds later. Each fetcher checks every part against its own header (a mismatch = the run fails) and writes the folder's
  `checksums.sha256` — what the restore checks.
- **THE FETCHERS** (public, no secrets): `scripts/backup/fetch.sh` (bash + curl + jq — the GitHub runner; `neon-backups-workflow.yml` = the
  private repo's `.github/workflows/backup.yml`, `neon-backups-README.md` its README) · `scripts/backup/fetch.ps1` (the mini PC; the token from
  `C:\Users\benja\NeonBackups\token.txt`; a line a run in `NeonBackups\backup.log`) · `scripts/backup/install.ps1` (once: makes the token —
  32 random bytes, hex — saves it readable by Ben's user only, registers the task) · `scripts/backup/restore-emulators.mjs` (the restore's step 1).

## What's in it

**Every DURABLE node** (`api/_lib/backup.js#DURABLE`): `profiles pstats uids seats progress lb dly results ppriv pkeys pfr flink tags vault`
(THE CARD LAB's marks = `vault/lab`) `radio` (presets, the crew, the push subscriptions) `city2` (the city's settings, the billboard) `members
gifts streak gplay pcount pkc pkx audit flags logstats errlog phonelog backups` (the reset's own copies).

**Left out on purpose:**
- the LIVE ones (`LIVE`): `rooms` (+ presence under it), `hush`, the per-room top-level nodes `chats fleets glsonar spy hsbet rrp rrsec seal
  hole hrec`, `rl` (rate limits), `here` (who's in the city), `wx` (the weather cache), `pkch` (a passkey's one-time challenge), the share
  cards' 7-day pictures `shr shrx shrp`, the emulator-only `test*` switches;
- the two DAILY SECRETS (`SECRET`): `dsecret` (THE DAILY SECRET) + `dsched` (the frozen schedule) — they make FUTURE days' answers and stay ONLY
  in the database (CLAUDE.md: "THE SERVER JUDGES … THE DAILY SECRET live ONLY in the database"). A restore without them = **/admin → THE
  DAILIES → RESEED** (a fresh secret from the next 4 am; today + the past untouched).
- `tests/backup.test.mjs` (THE CLASSIFICATION RULE) fails when the server code names a top-level node that is in none of the three lists — a
  new node's pass decides which.

**The size (measured on the emulators, `tests/integration/backup.test.mjs`, Nov 15):** a seeded 4,000-player database (profiles, stats, keys,
boards, 30 days × 3 dailies, 8,000 match results) = **1.70 MB gzipped in 29 parts** (the biggest: `dly` 1.12 MB), ~0.41 KB a player →
**14 nights ≈ 24 MB = 4.8 % of a free private repo's 500 MB artifact storage**. No part comes near the 4.5 MB answer limit until roughly
10× that (then `dly` splits by itself). Today's live database is a fraction of it.

## Restore (the owner's steps — the live database is NEVER restored by a script)

1. **Get a copy:** GitHub → Loewfizzle/neon-backups → Actions → the night's run → Artifacts → `neon-backup-<date>` (unzip it) · or the PC:
   `C:\Users\benja\NeonBackups\<date>\`.
2. **Verify the checksums:** in Git Bash, in the folder: `sha256sum -c checksums.sha256` (every line OK) — the restore script checks again.
3. **Restore to the EMULATORS first and check:** `cd tests/integration && npm run emulators`, then
   `node scripts/backup/restore-emulators.mjs "<the folder>"` → `node scripts/serve.mjs --emu` → open `http://localhost:5173/?emu` and look
   (a player's card, THE BOARD, the dailies' scores).
4. **Then the live database, by hand:** make the console's files — `node scripts/backup/restore-emulators.mjs "<the folder>" --json "<an out
   folder>"` (checks every checksum, then ONE plain `<node>.json` per node, a split node's slices merged; no database touched) → Firebase
   console → Realtime Database → Data → hover the node (e.g. `profiles`) → ⋮ → **Import JSON** → that node's file. Import REPLACES that node.
   Do `profiles`, `uids`, `ppriv`, `pkeys`, `pstats` first (the accounts), then the rest.
5. **The daily secrets** were never in the backup: /admin → THE DAILIES → RESEED.

## If the token leaks

Make a new one and paste it in the THREE places — the old one stops working at once:
1. On the mini PC: delete `C:\Users\benja\NeonBackups\token.txt`, then run `powershell -NoProfile -ExecutionPolicy Bypass -File scripts\backup\install.ps1`
   (a new token; the task re-registered).
2. Vercel → Settings → Environment Variables → `BACKUP_TOKEN` (Production) → the new value → **Redeploy**.
3. GitHub → Loewfizzle/neon-backups → Settings → Secrets → Actions → `BACKUP_TOKEN` → the new value (or `gh secret set BACKUP_TOKEN -R
   Loewfizzle/neon-backups < C:\Users\benja\NeonBackups\token.txt`).
The token only READS the backup door — it can't sign in, write, or reach anything else.

## Ben's steps (once)

1. Vercel → the project → Settings → Environment Variables → add **`BACKUP_TOKEN`** (Production) = the contents of
   `C:\Users\benja\NeonBackups\token.txt` → **Redeploy** (an env change needs a deploy).
2. Nothing else: the private repo, its workflow and its secret were made in CITY E (`gh` was signed in); the PC's task is registered.
   The first backups run that night (GitHub ~4:30 am, the PC ~4:45 am). Check /admin → BACKUPS the next morning; or run it now:
   GitHub → neon-backups → Actions → nightly backup → **Run workflow**.

## Tests

`node --test tests/backup.test.mjs` (unit: THE CLASSIFICATION RULE, the token, the parts + slices) · on the emulators:
`node --test backup.test.mjs` in `tests/integration` (the door 404 / 401, export → wipe → restore = identical, the live + secret nodes untouched,
a part over the limit split + restored whole, THE REAL SIZE — `SEED=<players>`). NEVER THE LIVE SITE.
