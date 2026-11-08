// THE RESEED (DM1 ADD-ON — docs/progression.md "THE SWITCH-OVER"): ONE command that rotates THE DAILY SECRET from the NEXT 4 am Eastern day on
// — THE PASSWORD's remaining schedule reordered by the new key, COAST CLEAR's boards from it, any stored future day dropped. Today's run, every
// past day and every result stay exactly as they were; nothing that uses the pepper (keys, tags, board ids) changes.
//
//   node scripts/dailies-reseed.mjs              rotate (the live database: FIREBASE_SERVICE_ACCOUNT + FIREBASE_DATABASE_URL in the env —
//                                                the same two Vercel has; or FIREBASE_DATABASE_EMULATOR_HOST for the emulators)
//   node scripts/dailies-reseed.mjs --dry-run    the plan, nothing written
//   node scripts/dailies-reseed.mjs --force      rotate again even though a key already starts tomorrow (safe: tomorrow hasn't begun)
// Safe to run twice: the second run says "already reseeded" and changes nothing. Prints every change it made.
import { reseedDailies } from '../api/_lib/daily-secret.js';
import { reseedSchedule } from '../api/_lib/pw.js';
import { fb, emulated } from '../api/_lib/fb.js';
import { DAILIES } from '../js/config.js';
import { deleteApp } from 'firebase-admin/app';

const args = new Set(process.argv.slice(2));
const dryRun = args.has('--dry-run') || args.has('-n'), force = args.has('--force');
console.log(`THE RESEED — ${emulated() ? 'the EMULATORS' : 'the LIVE database'}${dryRun ? ' (dry run: nothing written)' : ''}`);
try {
  const r = await reseedDailies({ dryRun, force, hooks: { games: [...DAILIES.map(d => d.id), 'test'], schedule: reseedSchedule } });
  for (const s of r.steps) console.log(`  · ${s}`);
  console.log(r.changed ? `DONE — the new days start ${r.from} at 4 am Eastern (today ${r.today} untouched).` : dryRun ? 'DRY RUN — run without --dry-run to do it.' : 'NOTHING CHANGED.');
} catch (e) {
  console.error(`FAILED: ${e && e.message}`);
  process.exitCode = 1;
} finally {
  try { await deleteApp(fb().app); } catch { /* not opened */ }
}
