# neon-backups (PRIVATE)

The nightly off-site copy of Neon Speakeasy's database — every durable node (profiles, progress, boards, the dailies' results, the Lab, the
radio, the city settings…). The live ones (rooms, presence, rate limits) and the two daily secrets are left out on purpose.

- **When:** every night ~4:30 am Eastern (`.github/workflows/backup.yml`) + Actions → *nightly backup* → **Run workflow** any time.
- **Where:** each run's **artifact** `neon-backup-<date>` (Actions → the run → Artifacts), kept **14 days**, then GitHub deletes it.
  Nothing is ever committed here — this repo holds only the workflow, its fetcher and this note.
- **Secret:** `BACKUP_TOKEN` (Settings → Secrets → Actions) = the same value as Vercel's `BACKUP_TOKEN`. It can only READ the backup
  door (`/api/admin?backup=…`) — not the owner's login, not the service account.
- **Restore:** download the artifact → check `checksums.sha256` (`sha256sum -c checksums.sha256`) → restore to the EMULATORS first →
  then the live database by hand (the Firebase console's Import, node by node). The full steps: `docs/backup.md` in the main repo.
- **The second copy:** the mini PC (`C:\Users\benja\NeonBackups\<date>\`, 14 days, a Windows scheduled task at ~4:45 am).
