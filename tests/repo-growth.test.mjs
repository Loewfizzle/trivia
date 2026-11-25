// FR7 FIXES B — D4 (the owner, Nov 12): THE REPO's GROWTH STOPPED. A pass's screenshots stay on the PC (.gitignore — docs/harbor/passes,
// docs/games, screenshots/); the ones committed before stay until THE PRIVATE FLIP's history rewrite (docs/launch.md). This fails when a
// NEW picture lands under docs/ or screenshots/ past the line: a picture a doc must carry = a JPEG at 1×, ≤ 150 KB, added on purpose.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { execSync } from 'node:child_process';

// THE HOUSEKEEPING PASS (Nov 25) — SCREENSHOTS OUT OF GIT, tightened: docs/ + screenshots/ held 328 pictures / 125 MB. From now on a pass's
// screenshots go to C:\Users\benja\Downloads\NEON\<pass>\ (the pattern several passes already use) — NEVER the repo: every picture under
// docs/ and screenshots/ is ignored by git, and a tracked one must be either
//   · LEGACY — on the frozen list of what was committed before Nov 25 (tests/fixtures/repo-images-before.txt; it only ever SHRINKS — deleting
//     one does not shrink history, so they stay until THE PRIVATE FLIP's history rewrite, docs/launch.md), or
//   · REFERENCE — named below WITH the doc that needs it (a picture a doc truly needs: a JPEG / WebP at 1×, ≤ 150 KB, `git add -f`).
// Anything else fails here, whatever its size.
const LEGACY = new Set(fs.readFileSync(new URL('./fixtures/repo-images-before.txt', import.meta.url), 'utf8').split('\n').map(l => l.trim()).filter(Boolean));
/** the pictures a doc truly needs — every one named, with its doc. The ones marked (legacy) were committed before the rule (any size);
 *  a NEW row = a JPEG / WebP at 1×, ≤ 150 KB */
const REFERENCE = {
  'docs/harbor/ref/city2-harbor.png': 'docs/harbor.md — the owner-approved City 2.0 look (legacy)',
  'docs/harbor/ref/city2-harbor-closeup.png': 'docs/harbor.md — the owner-approved City 2.0 look, close (legacy)',
  'docs/harbor/refs/abduction.jpeg': 'docs/harbor/passes/part-6b.md — the abduction reference (legacy)',
  'docs/harbor/refs/ufo/abduction-before-after.jpg': 'docs/harbor/passes/part-11a-2.md (legacy)',
  'docs/harbor/passes/board-2a/halo-before-after.png': 'docs/harbor/passes/board-2a.md (legacy)',
  'docs/harbor/passes/board-2a/rise-before-402.png': 'docs/harbor/passes/board-2a.md (legacy)',
  'docs/harbor/passes/board-2a/rise-after-402.png': 'docs/harbor/passes/board-2a.md (legacy)',
  'docs/harbor/passes/btc-card/mock-btc-v1.png': 'docs/harbor/passes/btc-card.md — the owner\'s mockup (legacy)',
  'docs/harbor/passes/load-fix-5/owner-iphone.png': 'docs/harbor/passes/load-fix-5.md — the owner\'s iPhone capture (legacy)',
  'docs/harbor/passes/load-fix-5/owner-vs-repro.png': 'docs/harbor/passes/load-fix-5.md (legacy)',
  'docs/harbor/passes/friends-b/gems-before.jpg': 'docs/vault.md — the gems before FRIENDS B (legacy)',
};
const IMG = /\.(png|jpe?g|webp|gif|avif|bmp|tiff?|heic)$/i;
const trackedPictures = () => execSync('git ls-files docs screenshots', { encoding: 'utf8' }).split('\n').filter(f => IMG.test(f));

test('THE HOUSEKEEPING PASS: NO new picture under docs/ or screenshots/ — a tracked one is LEGACY (the frozen list) or a named REFERENCE', () => {
  const now = trackedPictures(), extra = now.filter(f => !LEGACY.has(f) && !(f in REFERENCE));
  assert.deepEqual(extra, [], `a new picture in git: ${extra.slice(0, 8).join(', ')} — pass screenshots go to Downloads/NEON/<pass>/; a picture a doc truly needs = a row in REFERENCE (≤ ${SMALL_KB} KB, JPEG / WebP at 1×)`);
  assert.equal(LEGACY.size, 328, 'the frozen list is the Nov 25 one (it only shrinks: a line may be deleted WITH its file, never added)');
  assert.ok(now.length <= LEGACY.size, `${now.length} pictures tracked (328 on Nov 25 — never more; a new REFERENCE row replaces nothing, so count it here when one is added)`);
  for (const f of Object.keys(REFERENCE)) {
    assert.match(REFERENCE[f], /docs\/[\w./-]+\.md/, `${f}: names the doc that needs it`);
    assert.ok(fs.existsSync(f), `${f}: the reference is there`);
    if (LEGACY.has(f)) continue;
    // a NEW reference (not legacy) keeps the small line + a web format
    assert.match(f, /\.(jpe?g|webp)$/i, `${f}: a JPEG / WebP`);
    assert.ok(fs.statSync(f).size <= SMALL_KB * 1024, `${f}: ≤ ${SMALL_KB} KB`);
  }
  assert.ok(Object.keys(REFERENCE).length <= 25, 'the reference list stays SHORT');
});

test('every picture under docs/ + screenshots/ is IGNORED by git (a new one needs a deliberate git add -f + its REFERENCE row); the shots folders too', () => {
  const probe = ['docs/a.png', 'docs/harbor/new-thing.jpg', 'docs/harbor/refs/x/y.webp', 'docs/harbor/passes/housekeeping/a.png', 'docs/games/passes/x/b.jpeg', 'docs/vault/c.gif', 'screenshots/d.png', 'shots-anything/e.png', 'tests/integration/shots-review/f.png'];
  const out = execSync(`git check-ignore ${probe.join(' ')}`, { encoding: 'utf8' }).trim().split('\n').map(l => l.trim());
  assert.deepEqual(out, probe);
  // (a doc itself is never ignored)
  assert.throws(() => execSync('git check-ignore docs/harbor/passes/housekeeping.md', { encoding: 'utf8', stdio: 'pipe' }));
});

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
