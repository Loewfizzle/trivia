// FR7 FIXES B — D4 (the owner, Nov 12): THE REPO's GROWTH STOPPED. A pass's screenshots stay on the PC (.gitignore — docs/harbor/passes,
// docs/games, screenshots/); the ones committed before stay until THE PRIVATE FLIP's history rewrite (docs/launch.md). This fails when a
// NEW picture lands under docs/ or screenshots/ past the line: a picture a doc must carry = a JPEG at 1×, ≤ 150 KB, added on purpose.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { execSync } from 'node:child_process';

// (the committed pictures over 150 KB at FR7 FIXES B — Nov 12: 180 of the 299 under docs/, all 29 under screenshots/ — never more)
const BEFORE = { docs: 180, screenshots: 29 };
const SMALL_KB = 150;

test('the pass screenshots stay out of git: the ignore rule holds for a new pass\'s folder', () => {
  const out = execSync('git check-ignore docs/harbor/passes/some-new-pass/a.png docs/harbor/passes/x/y/z.jpg docs/games/x/a.webp screenshots/a.png', { encoding: 'utf8' });
  assert.equal(out.trim().split('\n').length, 4, out);
});

test('no NEW big picture committed under docs/ or screenshots/ (a new one = a JPEG at 1×, ≤ 150 KB)', () => {
  const files = execSync('git ls-files docs screenshots', { encoding: 'utf8' }).split('\n').filter(f => /\.(png|jpe?g|webp|gif)$/i.test(f));
  const big = files.filter(f => { try { return fs.statSync(f).size > SMALL_KB * 1024; } catch { return false; } });
  const docsBig = big.filter(f => f.startsWith('docs/')).length, shotsBig = big.filter(f => f.startsWith('screenshots/')).length;
  assert.ok(docsBig <= BEFORE.docs, `docs/: ${docsBig} pictures over ${SMALL_KB} KB (the line: ${BEFORE.docs})`);
  assert.ok(shotsBig <= BEFORE.screenshots, `screenshots/: ${shotsBig} over ${SMALL_KB} KB (the line: ${BEFORE.screenshots})`);
});

// CITY E — THE NIGHTLY BACKUP: a backup part, a backup folder or the token file never enters this PUBLIC repo (docs/backup.md)
test('a backup file / folder / token stays out of git (the ignore rule) and none is tracked', () => {
  const probe = ['x/profiles.json.gz', 'NeonBackups/d20261115/index.json', 'neon-backup-2026-11-15/profiles.json.gz', 'backups/a.json', 'backup-token.txt'];
  const out = execSync(`git check-ignore ${probe.join(' ')}`, { encoding: 'utf8' });
  assert.equal(out.trim().split('\n').length, probe.length, out);
  const tracked = execSync('git ls-files', { encoding: 'utf8' }).split('\n').filter(f => /\.json\.gz$|(^|\/)NeonBackups\/|(^|\/)neon-backup[^/]*\/|backup-token/i.test(f));   // (a backup FOLDER — scripts/backup/neon-backups-*.md|yml are the private repo's sources, no data)
  assert.deepEqual(tracked, [], 'no backup file is tracked');
});
