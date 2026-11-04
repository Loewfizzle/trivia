// THE VAULT 2C on the emulators (/api, no browser): ONE EMBLEM SYSTEM — the 12 sign-up shapes are every member's from day one (a new profile
// owns them; an older profile is back-filled on 'me'); wearing one in CUSTOMIZE sets the profile's shape (`a`) + takes a worn earned emblem
// off (`es`); a shape that isn't one of the 12 is refused. + THE LAB 2.0: a mark stores the version it was made at.
//   cd tests/integration && node --test vault-2c.test.mjs        (the emulators running)
process.env.FIREBASE_DATABASE_EMULATOR_HOST ||= '127.0.0.1:9000';
process.env.FIREBASE_AUTH_EMULATOR_HOST ||= '127.0.0.1:9099';
process.env.GCLOUD_PROJECT ||= 'demo-arcade';
process.env.ADMIN_PIDS = '';

import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { ref, val, fb } from '../../api/_lib/fb.js';
import { deleteApp } from 'firebase-admin/app';
import { profileAction } from '../../api/profile.js';
import { labMark, labMarks } from '../../api/_lib/lab.js';
import { SIGN_EMBLEMS } from '../../js/core/items.js';
import { verOf } from '../../js/vault/catalog.js';

const NOW = Date.UTC(2026, 10, 3, 23, 0, 0);
const NODES = ['profiles', 'uids', 'pstats', 'ppriv', 'pkeys', 'tags', 'rl', 'members', 'vault'];
before(async () => { await ref('/').update(Object.fromEntries(NODES.map(n => [n, null]))); });
after(async () => { await deleteApp(fb().app); });

const ensure = (uid, name) => profileAction(uid, { action: 'ensure', name, avatar: 'bolt', color: 'cyan' }, '', NOW);
const act = (uid, body) => profileAction(uid, body, '', NOW);

test('ONE EMBLEM SYSTEM: a sign-up writes no stats (a first match is still a first); a member with stats is back-filled on me', async () => {
  const r = await ensure('c-new', 'Nia');
  assert.equal(await val(`pstats/${r.pid}`), null, 'no stats at sign-up — the 12 are owned through STARTER from the first second');
  await act('c-new', { action: 'me' });
  assert.equal(await val(`pstats/${r.pid}`), null, 'nor on a me before any match');
  // an older profile (made before 2C): no items at all → 'me' back-fills them
  const o = await ensure('c-old', 'Odo');
  await ref(`pstats/${o.pid}`).set({ xp: 40, it: { 'card-gilded': NOW - 1e6 } });
  const me = await act('c-old', { action: 'me' });
  assert.deepEqual(SIGN_EMBLEMS.filter(id => !me.stats.it[id]), [], 'back-filled');
  assert.ok(me.stats.it['card-gilded'], 'nothing they owned is lost');
});

test('ONE EMBLEM SYSTEM: wearing a sign-up shape sets the profile\'s shape (a) + takes an earned emblem off; others refused', async () => {
  const r = await ensure('c-wear', 'Wren');
  await ref(`pstats/${r.pid}/it/emb-owl`).set(NOW);
  await act('c-wear', { action: 'style', shape: 'emb-owl' });
  assert.equal(await val(`profiles/${r.pid}/es`), 'emb-owl');
  const out = await act('c-wear', { action: 'style', shape: 'emb-sign-ghost' });
  assert.equal(await val(`profiles/${r.pid}/a`), 'ghost');
  assert.equal(await val(`profiles/${r.pid}/es`), null, 'the earned emblem came off');
  assert.equal(out.profile.a, 'ghost');
  await assert.rejects(act('c-wear', { action: 'style', shape: 'emb-sign-nope' }), e => e.status === 403);
  await assert.rejects(act('c-wear', { action: 'style', shape: 'emb-crown' }), e => e.status === 403, 'an emblem not owned');
});

test('THE LAB 2.0: a mark stores the version it was made at (a newer version later = CHANGED)', async () => {
  await labMark('pid-owner', { id: 'card-inferno', mark: 'approve' }, NOW);
  await labMark('pid-owner', { id: 'card-smoke', mark: 'fix', note: 'x' }, NOW);
  const m = await labMarks();
  assert.equal(m['card-inferno'].v, verOf('card-inferno'));
  assert.equal(m['card-smoke'].v, 1);
});
