// FR6 FIXES A (G6) — THE RULES AS PUBLISHED. LOBBY 2.0 B changed database.rules.json (meta/go, meta/back, rv), the summary didn't lead with
// it, the live database kept the old rules and the show failed silently on every real phone. tests/fixtures/rules-live.json is a copy of
// the rules AS THE OWNER LAST PUBLISHED THEM (Firebase console → Realtime Database → Rules). This test fails the moment database.rules.json
// differs from it — until tests/fixtures/rules-live.ack.json names the new rules' hash + the summary's FIRST line ("RULES CHANGED: … —
// RE-PUBLISH"). The ack IS the reminder, in the unit suite before every push. Once the owner confirms the re-publish, the next pass copies
// database.rules.json over the fixture and deletes the ack. docs/testing.md "THE RULES-LAG".
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';

const at = p => new URL(`../${p}`, import.meta.url);
const canon = txt => JSON.stringify(JSON.parse(txt));
const hash = txt => createHash('sha256').update(canon(txt)).digest('hex').slice(0, 16);

/** the rule paths that differ between two rule trees (added / removed / changed leaves, as a.b.c) */
export function ruleDiff(a, b, path = '') {
  if (JSON.stringify(a) === JSON.stringify(b)) return [];
  const oa = a && typeof a === 'object', ob = b && typeof b === 'object';
  if (!oa || !ob) return [path || '(root)'];
  const out = [];
  for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) out.push(...ruleDiff(a[k], b[k], path ? `${path}/${k}` : k));
  return out;
}

test('the rules in the repo are the rules as PUBLISHED — or the change is acknowledged with the summary\'s RE-PUBLISH line', () => {
  const cur = readFileSync(at('database.rules.json'), 'utf8');
  const live = readFileSync(at('tests/fixtures/rules-live.json'), 'utf8');
  if (canon(cur) === canon(live)) return;
  const diff = ruleDiff(JSON.parse(live), JSON.parse(cur)).slice(0, 12);
  const ackPath = at('tests/fixtures/rules-live.ack.json');
  const ack = existsSync(ackPath) ? JSON.parse(readFileSync(ackPath, 'utf8')) : null;
  assert.ok(ack && ack.hash === hash(cur) && /^RULES CHANGED: .*RE-PUBLISH/.test(ack.line || ''),
    `database.rules.json differs from the rules as published (tests/fixtures/rules-live.json) at:\n  ${diff.join('\n  ')}\n` +
    `→ the live database refuses whatever the code now needs there. Write tests/fixtures/rules-live.ack.json:\n` +
    `  { "hash": "${hash(cur)}", "line": "RULES CHANGED: <the paths> — RE-PUBLISH database.rules.json in the Firebase console" }\n` +
    `and make that line the FIRST line of the pass's summary. When the owner has re-published: copy database.rules.json over the fixture, delete the ack.`);
  console.log(`[rules-live] ${ack.line}`);
});

test('ruleDiff names the changed paths', () => {
  assert.deepEqual(ruleDiff({ r: { a: 1, b: { c: 2 } } }, { r: { a: 1, b: { c: 3 }, d: 4 } }), ['r/b/c', 'r/d']);
  assert.deepEqual(ruleDiff({ x: 1 }, { x: 1 }), []);
});

test('the rules-lag path shapes mask every id (no room code, uid or match id reaches /admin)', async () => {
  const { pathShape, isRefusal } = await import('../js/core/rules-lag.js');
  assert.equal(pathShape('/rooms/MOVE/meta/go'), 'rooms/*/meta/go');
  assert.equal(pathShape('rooms/ABCD/players/Xy7aQ1bcdEfGhIjKlmnOp/ln'), 'rooms/*/players/*/ln');
  assert.equal(pathShape('seal/HAND/oc/m123/r1/u9'), 'seal/*/oc/*/*/*');
  assert.equal(pathShape('city2/live'), 'city2/live');
  assert.equal(pathShape('rooms/ABCD/meta/hostBeat'), 'rooms/*/meta/hostBeat');
  assert.ok(isRefusal({ code: 'PERMISSION_DENIED' }));
  assert.ok(isRefusal(new Error('PERMISSION_DENIED: Permission denied')));
  assert.ok(!isRefusal(new Error('network error')));
});

test('every database write in the app goes through the one write path (firebase.js#write)', () => {
  const src = readFileSync(at('js/firebase.js'), 'utf8');
  for (const op of ['set', 'update', 'remove', 'push', 'runTransaction']) assert.ok(src.includes(`export const ${op} = write('${op}');`), `${op} goes through write()`);
});
