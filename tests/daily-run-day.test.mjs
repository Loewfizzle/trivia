// DFIX1 — A RUN KEEPS ITS OWN DAY on the phone (js/daily/run-day.js): the judge remembers the day its start returned while the run is in flight,
// sends it on every call, asks for it back on a start (a refresh across 4 am Eastern), and forgets it once the run is scored.
import test from 'node:test';
import assert from 'node:assert/strict';

const store = new Map();
globalThis.localStorage = { getItem: k => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: k => store.delete(k) };
const { runDay } = await import('../js/daily/run-day.js');

test('the run\'s day: none before a start; kept while the run is in flight; sent on every call; asked back by a fresh judge; forgotten once scored', () => {
  store.clear();
  const a = runDay('password');
  assert.equal(a.asked(), null);
  assert.deepEqual(a.with({ action: 'guess' }), { action: 'guess' }, 'no day before a start (the server takes today\'s)');
  a.started({ day: 'd20261201', done: null });
  assert.deepEqual(a.with({ action: 'guess', word: 'CRANE' }), { action: 'guess', word: 'CRANE', day: 'd20261201' });
  // a refresh (a new judge on the same device) asks for that run back — even after 4 am
  const b = runDay('password');
  assert.equal(b.asked(), 'd20261201');
  // the start that comes back is the old run (the server resumed it): still in flight
  b.started({ day: 'd20261201', done: null });
  b.scored();
  assert.equal(runDay('password').asked(), null, 'scored: the next start opens today\'s');
  assert.equal(b.day(), 'd20261201', 'the scored run keeps its day for its own last calls');
  // a start that lands on a finished run (done) remembers nothing
  const c = runDay('password');
  c.started({ day: 'd20261202', done: 4 });
  assert.equal(runDay('password').asked(), null);
  // per game
  runDay('coastclear').started({ day: 'd20261202', done: null });
  assert.equal(runDay('coastclear').asked(), 'd20261202');
  assert.equal(runDay('password').asked(), null);
});

test('no storage (a private window): the memory copy still names the day on every call', () => {
  const saved = globalThis.localStorage;
  globalThis.localStorage = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); }, removeItem() { throw new Error('blocked'); } };
  try {
    const a = runDay('password');
    assert.equal(a.asked(), null);
    a.started({ day: 'd20261201', done: null });
    assert.equal(a.with({}).day, 'd20261201');
    a.scored();
  } finally { globalThis.localStorage = saved; }
});
