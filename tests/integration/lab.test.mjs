// THE VAULT 1A — THE CARD LAB on the emulators (/api, no browser): only the OWNER (ADMIN_PIDS) reads or marks; THE CREW + a stranger are
// refused; a mark is stored + audited + kept in the history; a bad id / mark refused; THE EXPORT carries ids + marks + notes, never a name
// or a profile id.
//   cd tests/integration && node --test lab.test.mjs        (the emulators running)
process.env.FIREBASE_DATABASE_EMULATOR_HOST ||= '127.0.0.1:9000';
process.env.FIREBASE_AUTH_EMULATOR_HOST ||= '127.0.0.1:9099';
process.env.GCLOUD_PROJECT ||= 'demo-arcade';
process.env.ADMIN_PIDS = '';

import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { ref, val, fb } from '../../api/_lib/fb.js';
import { deleteApp } from 'firebase-admin/app';
import { profileAction } from '../../api/profile.js';
import { adminAction } from '../../api/admin.js';
import { labExport } from '../../api/_lib/lab.js';

before(async () => { await ref('/').update({ vault: null, audit: null, 'radio/crew': null }); });
after(async () => { await deleteApp(fb().app); });
const ensure = (uid, name) => profileAction(uid, { action: 'ensure', name, avatar: 'bolt', color: 'cyan' }, '', Date.now());
const rejects = async (p, status) => { try { await p; } catch (e) { assert.equal(e.status, status, e.message); return; } assert.fail(`expected ${status}`); };

test('THE CARD LAB: the owner marks (stored + audited + the history); the crew + a stranger can neither read nor mark', async () => {
  const owner = await ensure('lab-owner', 'Ben'), crew = await ensure('lab-crew', 'Cara'), stranger = await ensure('lab-x', 'Xan');
  process.env.ADMIN_PIDS = owner.pid;
  await ref(`radio/crew/${crew.pid}`).set({ at: Date.now(), by: owner.pid, n: 'Cara', t: '1234' });
  for (const uid of ['lab-crew', 'lab-x']) {
    await rejects(adminAction(uid, { action: 'labMarks' }), 403);
    await rejects(adminAction(uid, { action: 'labMark', id: 'card-smoke', mark: 'approve' }), 403);
  }
  assert.equal(await val('vault/lab'), null, 'nothing written by the refused');
  const r = await adminAction('lab-owner', { action: 'labMark', id: 'card-smoke', mark: 'fix', note: 'Thicker smoke, curl more' });
  assert.equal(r.marks['card-smoke'].m, 'fix'); assert.equal(r.marks['card-smoke'].note, 'Thicker smoke, curl more');
  await adminAction('lab-owner', { action: 'labMark', id: 'card-sg-ufo', mark: 'approve' });
  await adminAction('lab-owner', { action: 'labMark', id: 'card-glitter', mark: 'cut' });
  const all = await adminAction('lab-owner', { action: 'labMarks' });
  assert.deepEqual(Object.keys(all.marks).sort(), ['card-glitter', 'card-sg-ufo', 'card-smoke']);
  assert.equal((await val('vault/lab/card-sg-ufo')).by, owner.pid, 'who marked it');
  const audit = Object.values((await val('audit')) || {}).filter(a => a.act === 'labMark');
  assert.equal(audit.length, 3, 'every mark audited'); assert.ok(audit.every(a => a.by === owner.pid));
  assert.equal(Object.keys((await val('vault/labLog')) || {}).length, 3, 'the history keeps each change');
  // a clear (null) + bad input
  const cl = await adminAction('lab-owner', { action: 'labMark', id: 'card-glitter', mark: null });
  assert.equal(cl.marks['card-glitter'].m, null);
  await rejects(adminAction('lab-owner', { action: 'labMark', id: 'card-nope', mark: 'approve' }), 400);
  await rejects(adminAction('lab-owner', { action: 'labMark', id: 'card-smoke', mark: 'love' }), 400);
  const long = await adminAction('lab-owner', { action: 'labMark', id: 'card-prism', mark: 'fix', note: 'x'.repeat(900) });
  assert.equal(long.marks['card-prism'].note.length, 400, 'a note is capped');
  void stranger;
});

test('THE EXPORT (GET /api/admin?lab=export): ids + marks + notes + when — never a name or a profile id', async () => {
  const ex = await labExport();
  assert.equal(ex.marks['card-sg-ufo'].m, 'approve'); assert.equal(ex.marks['card-smoke'].note, 'Thicker smoke, curl more');
  const txt = JSON.stringify(ex);
  assert.ok(!/"by"/.test(txt), 'no profile id'); assert.ok(!/Ben|Cara/.test(txt), 'no names');
});
