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
10× that. Today's live database is a fraction of it. (THE BEFORE-LAUNCH PASS corrected this line: `dly` did NOT split by itself — one child
per daily, the first-level slices could never fit; THE DEEP SLICES below.)

## Restore (the owner's steps — the live database is NEVER restored by a script)

1. **Get a copy:** GitHub → Loewfizzle/neon-backups → Actions → the night's run → Artifacts → `neon-backup-<date>` (unzip it) · or the PC:
   `C:\Users\benja\NeonBackups\<date>\`.
2. **Verify the checksums:** in Git Bash, in the folder: `sha256sum -c checksums.sha256` (every line OK) — the restore script checks again.
   (FIXES R1: the PC writes the file with LF line ends; a PC folder from BEFORE FIXES R1 has CRLF — every line then "FAILED open or read":
   `tr -d '\r' < checksums.sha256 | sha256sum -c` checks it. The restore script reads either.)
3. **Restore to the EMULATORS first and check:** `cd tests/integration && npm run emulators`, then
   `node scripts/backup/restore-emulators.mjs "<the folder>"` → `node scripts/serve.mjs --emu` → open `http://localhost:5173/?emu` and look
   (a player's card, THE BOARD, the dailies' scores).
4. **Then the live database, by hand:** make the console's files — `node scripts/backup/restore-emulators.mjs "<the folder>" --json "<an out
   folder>"` (checks every checksum, then ONE plain `<node>.json` per node, a split node's slices merged; no database touched) → Firebase
   console → Realtime Database → Data → hover the node (e.g. `profiles`) → ⋮ → **Import JSON** → that node's file. Import REPLACES that node.
   Do `profiles`, `uids`, `ppriv`, `pkeys`, `pstats` first (the accounts), then the rest.
5. **The daily secrets** were never in the backup: /admin → THE DAILIES → RESEED.
6. **THE PEPPER (THE FIX PASS — THE FABLE REVIEW's D6):** every restore key and every board id is an HMAC of `KEY_PEPPER` (Vercel's env var;
   without it, one derived from the service account's private key — `api/_lib/fb.js`). The pepper is in NEITHER backup copy. A restore into
   the SAME project needs nothing; a restore into a NEW Firebase / Vercel project needs the SAME `KEY_PEPPER` set **before the first request**,
   or no restore key works and every account is orphaned. **The owner keeps a copy of `KEY_PEPPER` (and the three `VAPID_*` keys) in his
   password manager — his step, once** (Vercel → Settings → Environment Variables → reveal → copy into the password manager). Never print,
   log, commit or change it. Fallback if the backup function itself is down: Firebase console → Realtime Database → Data → ⋮ → **Export JSON**.

## When the PC's copy is skipped (THE REVIEW A16 — written down, FIXES R1)
- The PC's task is registered to run **only while Ben's user is signed in** (`install.ps1` — `LogonType Interactive`: no stored password). After
  a reboot with nobody signed in, or a sign-out, there is NO second copy until Ben signs in again — then the task runs "as soon as possible
  after a missed start". **GitHub (the private repo, ~4:30 am) is the MAIN copy and never depends on the PC.** /admin's BACKUPS row shows THE PC
  red once its last pickup is 36 h old — that's the sign to sign in (or check `C:\Users\benja\NeonBackups\backup.log`).
- To make it run signed out too: Task Scheduler → "Neon Speakeasy nightly backup" → Properties → "Run whether user is logged on or not" (Windows
  asks for Ben's password once) — Ben's call; not done by a pass.

## If the token leaks

Make a new one and paste it in the THREE places — the old one stops working at once:
1. On the mini PC: delete `C:\Users\benja\NeonBackups\token.txt`, then run `powershell -NoProfile -ExecutionPolicy Bypass -File scripts\backup\install.ps1`
   (a new token; the task re-registered).
2. Vercel → Settings → Environment Variables → `BACKUP_TOKEN` (Production) → the new value → **Redeploy**.
3. GitHub → Loewfizzle/neon-backups → Settings → Secrets → Actions → `BACKUP_TOKEN` → the new value (or `gh secret set BACKUP_TOKEN -R
   Loewfizzle/neon-backups < C:\Users\benja\NeonBackups\token.txt`).
The token only READS the backup door — it can't sign in, write, or reach anything else.

## Ben's steps (once)

0. **(THE FIX PASS — D6)** Copy `KEY_PEPPER` + the three `VAPID_*` values from Vercel into your password manager (see Restore step 6).
1. Vercel → the project → Settings → Environment Variables → add **`BACKUP_TOKEN`** (Production) = the contents of
   `C:\Users\benja\NeonBackups\token.txt` → **Redeploy** (an env change needs a deploy).
2. Nothing else: the private repo, its workflow and its secret were made in CITY E (`gh` was signed in); the PC's task is registered.
   The first backups run that night (GitHub ~4:30 am, the PC ~4:45 am). Check /admin → BACKUPS the next morning; or run it now:
   GitHub → neon-backups → Actions → nightly backup → **Run workflow**.

## Tests

`node --test tests/backup.test.mjs` (unit: THE CLASSIFICATION RULE, the token, the parts + slices) · on the emulators:
`node --test backup.test.mjs` in `tests/integration` (the door 404 / 401, export → wipe → restore = identical, the live + secret nodes untouched,
a part over the limit split + restored whole, THE REAL SIZE — `SEED=<players>`). NEVER THE LIVE SITE.

## CITY I (Nov 18) — two new nodes
`seen` (SECOND ACCOUNTS — hashed addresses, 14 days) = **LIVE** (never DURABLE with addresses); `nocount` (DON'T COUNT — the owner's decisions, no
address in it) = **DURABLE**. `api/_lib/backup-pure.js` — `tests/backup.test.mjs`.

## THE DEEP SLICES (THE BEFORE-LAUNCH PASS, Nov 22 — review-nov15 A6)
A part over the limit used to be sliced by a hash of its FIRST-LEVEL keys: `dly` has one child per daily (five now), `lb` one per board,
`backups` one per reset — once ONE child alone passed the 4.5 MB answer limit its slice could never fit, and the backup would fail every
night from then on. Now (`api/_lib/backup-pure.js#unitsOf` · `sliceTree` · `deepMerge`, `api/_lib/backup.js#exportPart`):
- a slice is made of the node's DEEP UNITS — its branches at a fixed depth (`UNIT_DEPTH`: `dly/<game>/<day>/<field>` = 4, `lb/<board>/<scope>`
  = 3, `backups/<stamp>` = 2, everything else 1), any branch still over `UNIT_MAX_RAW` (512 KB of JSON) descended further — each unit to
  slice `fnv1a(its path) % k`: the same units on every request (the database is live), a slice = a partial tree;
- the 409's `k` is CHECKED to fit (every slice packed under the limit, else more slices, up to 64; none fits → 507 `too_big`, a unit
  alone too big — raise its depth);
- ONE read of the node serves its slices on a warm function (a 2-min snapshot) — no longer k + 1 reads of the whole node a night;
- the restore merges a split node's parts ALL THE WAY DOWN (`deepMerge` — `restoreToEmulators` + `restore-emulators.mjs --json`); an old
  backup's first-level slices merge the same way.
- **The fetchers are unchanged** (`fetch.sh` / `fetch.ps1` in the private repo + the mini PC: the same `?backup=<node>&slice=i/k` and
  `<node>@<i>of<k>.json.gz` names) — nothing for the owner to copy.
- **The Spark maths:** CITY E's 4,000 seeded players = 1.70 MB gzipped a night (`dly` 1.12 MB of it); `dly` grows with every day played.
  The download is now ~1× the node a night per copy (two copies) — ~3.4 MB a night ≈ 0.1 GB a month of Spark's 10 GB.
- Tests: `tests/backup.test.mjs` "THE DEEP SLICES" (every unit in exactly one slice, merged back exactly, a giant branch descended) +
  `tests/integration/backup.test.mjs` (a FAT `dly` — three children each ~18 KB gzipped at a 12 KB limit: every slice under it, restored
  whole; red on the old code).
