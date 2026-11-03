// THE VAULT 2B on the emulators (/api, no browser): MEMBER NUMBERS (the owner Nº 1 — reserved —, everyone else from Nº 2 in join order,
// the back-fill of profiles made before numbers by their `at`, never reused, never changed, server-written only) + THE TWO DEV CARDS (the
// owner's profile — ADMIN_PIDS — gets them on 'me'; a stranger + a crew member never hold them + can't wear them) + THE SEASONAL EMBLEMS
// through a real counted match on Halloween.
//   cd tests/integration && node --test vault-2b.test.mjs        (the emulators running)
process.env.FIREBASE_DATABASE_EMULATOR_HOST ||= '127.0.0.1:9000';
process.env.FIREBASE_AUTH_EMULATOR_HOST ||= '127.0.0.1:9099';
process.env.GCLOUD_PROJECT ||= 'demo-arcade';
process.env.ADMIN_PIDS = '';

import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { ref, val, fb } from '../../api/_lib/fb.js';
import { deleteApp } from 'firebase-admin/app';
import { profileAction } from '../../api/profile.js';
import { memberLabel } from '../../api/_lib/members.js';
import { DEV_CARDS } from '../../js/core/dev-cards.js';
import { matchStep } from '../../js/core/progress.js';
import { withShow } from '../../api/_lib/catalog.js';

const NOW = Date.UTC(2026, 10, 3, 22, 0, 0);
const NODES = ['profiles', 'uids', 'pstats', 'ppriv', 'pkeys', 'tags', 'rl', 'members', 'radio', 'audit'];
before(async () => { await ref('/').update(Object.fromEntries(NODES.map(n => [n, null]))); });
after(async () => { await deleteApp(fb().app); });

const ensure = (uid, name, at = NOW) => profileAction(uid, { action: 'ensure', name, avatar: 'bolt', color: 'cyan' }, '', at);
const me = (uid, at = NOW) => profileAction(uid, { action: 'me' }, '', at);
const rejects = async (p, status, code) => {
  try { await p; } catch (e) { assert.equal(e.status, status, `${code}: status ${e.status} (${e.message})`); if (code) assert.equal(e.code, code); return; }
  assert.fail(`expected ${status} ${code}`);
};

test('MEMBER NUMBERS: the back-fill by join order (the owner Nº 1, reserved), then every new profile the next; never reused, never changed', async () => {
  // three profiles from BEFORE member numbers (no mn, made in this order — the owner the LAST of them)
  const old = [['m-ann', 'Ann', NOW - 3e7], ['m-bo', 'Bo', NOW - 2e7], ['m-own', 'Owner', NOW - 1e7]];
  for (const [uid, name, at] of old) await ensure(uid, name, at);
  const pids = {}; for (const [uid] of old) pids[uid] = await val(`uids/${uid}`);
  // (they were made before the numbers existed: take theirs away + the counter, as the live site has them today)
  await ref('/').update({ members: null, ...Object.fromEntries(Object.values(pids).map(p => [`profiles/${p}/mn`, null])) });
  process.env.ADMIN_PIDS = pids['m-own'];
  try {
    const a = await me('m-ann');
    assert.equal(a.profile.mn, 2, 'the first member after the owner: Nº 2 (by when the profile was made)');
    assert.equal((await me('m-own')).profile.mn, 1, 'THE OWNER: Nº 1 — reserved, though he joined last');
    assert.equal((await me('m-bo')).profile.mn, 3);
    const c = await ensure('m-cy', 'Cy', NOW + 1e3);
    assert.equal(c.profile.mn, 4, 'a NEW profile: the next number');
    assert.equal(memberLabel(1), '0001'); assert.equal(memberLabel(4), '0004'); assert.equal(memberLabel(12345), '12345'); assert.equal(memberLabel(null), null);
    // never changed: a rename, a second 'me' keep it
    await profileAction('m-ann', { action: 'rename', name: 'Annie' }, '', NOW + 2 * 864e5);
    assert.equal((await me('m-ann', NOW + 2 * 864e5)).profile.mn, 2);
    // never reused: a profile deleted, the next new one still takes a fresh number
    await ref(`profiles/${pids['m-bo']}`).remove();
    const d = await ensure('m-dee', 'Dee', NOW + 2e3);
    assert.equal(d.profile.mn, 5, 'Nº 3 is never handed out again');
    assert.equal(await val('members/next'), 6);
  } finally { process.env.ADMIN_PIDS = ''; }
});

test('THE TWO DEV CARDS: the owner gets them on "me" + wears either; a stranger + a crew member never hold them, the server refuses their wear', async () => {
  const own = await ensure('dv-own', 'Loewfizzle'), str = await ensure('dv-str', 'Stranger'), crew = await ensure('dv-crew', 'Crew');
  await ref(`radio/crew/${crew.pid}`).set({ at: NOW, by: own.pid });
  process.env.ADMIN_PIDS = own.pid;
  try {
    const m = await me('dv-own');
    for (const id of DEV_CARDS) assert.ok(m.stats.it[id], `the owner holds ${id}`);
    const w = await profileAction('dv-own', { action: 'style', card: 'card-dev-source' }, '', NOW);
    assert.equal(w.profile.cd, 'card-dev-source');
    await profileAction('dv-own', { action: 'style', card: 'card-dev-switchboard' }, '', NOW);
    for (const uid of ['dv-str', 'dv-crew']) {
      const x = await me(uid);
      for (const id of DEV_CARDS) assert.ok(!x.stats.it[id], `${uid} never holds ${id}`);
      for (const id of DEV_CARDS) await rejects(profileAction(uid, { action: 'style', card: id }, '', NOW), 403, 'locked');
    }
    // even an item planted by hand: the server takes it back on 'me' + refuses the wear
    await ref(`pstats/${str.pid}/it/card-dev-source`).set(NOW);
    await rejects(profileAction('dv-str', { action: 'style', card: 'card-dev-source' }, '', NOW), 403, 'locked');
    const back = await me('dv-str');
    assert.ok(!back.stats.it['card-dev-source'], 'a stranger holding a dev card loses it');
    // names only to owners: the owner's 'me' describes them; the stranger's never does
    const sm = withShow(m), sb = withShow(back);   // (the route's wrapper: names only for the ids the answer holds)
    assert.ok(sm.show && sm.show.items['card-dev-source'] && sm.show.items['card-dev-source'].name, 'the owner sees the name');
    assert.ok(!(sb.show && sb.show.items && sb.show.items['card-dev-source']), 'the stranger never sees it');
  } finally { process.env.ADMIN_PIDS = ''; }
});

test('THE SEASONAL EMBLEMS: a counted match during the holiday gives its emblem (once, kept); an ordinary day gives none', () => {
  const row = { rank: 1, win: true, c: 1, rec: {} };
  const s0 = { xp: 100, it: {}, g: {} };
  const hw = matchStep(s0, { key: 'k1', gid: 'prism', row, n: 2, now: Date.UTC(2026, 9, 31, 23), gap: 0, ctx: { holiday: 'halloween' } });
  assert.ok(hw.items.includes('emb-hw') && hw.next.it['emb-hw'], 'Halloween → its emblem');
  const again = matchStep(hw.next, { key: 'k2', gid: 'prism', row, n: 2, now: Date.UTC(2026, 9, 31, 23, 30), gap: 0, ctx: { holiday: 'halloween' } });
  assert.ok(!again.items.includes('emb-hw'), 'once');
  const plain = matchStep(s0, { key: 'k3', gid: 'prism', row, n: 2, now: Date.UTC(2026, 10, 5, 23), gap: 0, ctx: { holiday: null } });
  assert.ok(!plain.items.some(id => /^emb-(hw|tg|xmas|nye)$/.test(id)), 'an ordinary day: none');
  for (const [hol, id] of [['thanksgiving', 'emb-tg'], ['christmas', 'emb-xmas'], ['nye', 'emb-nye']]) {
    const r = matchStep(s0, { key: `k-${hol}`, gid: 'prism', row, n: 2, now: NOW, gap: 0, ctx: { holiday: hol } });
    assert.ok(r.items.includes(id), `${hol} → ${id}`);
  }
});
