// CITY FIXES + HOLD'EM — THE HOLD'EM BILLBOARD (core/harbor-holdem.js): the base poster's state, THE BILLPOSTER pasting it ONCE then staying
// home (every other worker still comes), the day chart's line, the owner's switch cleaned, the messages still interrupting.
import test from 'node:test';
import assert from 'node:assert/strict';
import { setHoldem, setHoldemForce, holdemShow, holdemKeeps, holdemState, cleanHoldem, holdemRev } from '../js/core/harbor-holdem.js';
import { workDay } from '../js/core/harbor-workers.js';
import { knob } from '../js/core/harbor-schedule.js';
import { billboardRows } from '../js/core/harbor-billboard.js';
import { dayChart } from '../js/core/harbor-daychart.js';

const day0Of = key => Date.parse(`${key}T00:00:00-05:00`) / 1000;
const reset = () => { setHoldemForce(null); setHoldem(null); };

test('the default (no switch set): ON · COMING SOON from the timetable row\'s `since`; before it the day\'s game', () => {
  reset();
  const D = knob('billboard.holdem');
  assert.equal(D.since, '2026-11-08');
  assert.equal(holdemState().src, 'default');
  assert.equal(holdemShow('2026-11-07'), null, 'the day before: the game');
  assert.equal(holdemShow('2026-11-08'), 'holdem');
  assert.equal(holdemShow('2026-12-01'), 'holdem', 'no end date — until the owner changes it');
  // (the city's own keys are NOT zero-padded — '2026-11-8': the same day; a text compare said "before" — the WebKit shot caught it)
  assert.equal(holdemShow('2026-11-8'), 'holdem');
  assert.equal(holdemShow('2026-11-7'), null);
  assert.equal(holdemShow('2026-11-10'), 'holdem');
});

test('the owner\'s switch: OFF → the games back; NOW OPEN → the same poster, the other bar; a bad value = the default', () => {
  reset();
  const r0 = holdemRev();
  setHoldem({ on: false });
  assert.ok(holdemRev() > r0, 'a change bumps the revision (the workers re-plan)');
  assert.equal(holdemShow('2026-11-20'), null);
  setHoldem({ on: true, bar: 'open', since: '2026-11-21' });
  assert.equal(holdemShow('2026-11-20'), null);
  assert.equal(holdemShow('2026-11-21'), 'holdem-open');
  assert.deepEqual(cleanHoldem({ on: 'x', bar: 'weird', since: 'nope' }), { on: true, bar: 'soon', since: null });
  assert.equal(cleanHoldem(null), null);
  reset();
});

test('THE BILLPOSTER pastes HOLD\'EM once (the first evening), then stays home — every other worker still comes', () => {
  reset();
  setHoldem({ on: true, bar: 'soon', since: '2026-11-10' });
  const kinds = key => workDay(key, { seed: 1924, day0: day0Of(key), off: -300 }).map(w => w.kind);
  assert.ok(kinds('2026-11-10').includes('billposter'), 'the first day: he pastes it (game → HOLD\'EM)');
  assert.equal(holdemKeeps('2026-11-10'), false);
  for (const k of ['2026-11-11', '2026-11-12', '2026-11-15']) { assert.equal(holdemKeeps(k), true); assert.ok(!kinds(k).includes('billposter'), `${k}: no billposter`); }
  // every other show still comes (his random draw is still taken); the windowed ones may slide a few minutes into the gap he leaves
  const plan = on => { setHoldem(on ? { on: true, since: '2026-11-10' } : { on: false }); return Object.fromEntries(workDay('2026-11-12', { seed: 1924, day0: day0Of('2026-11-12'), off: -300 }).filter(w => w.kind !== 'billposter').map(w => [w.kind, w.t0])); };
  const a = plan(true), b = plan(false);
  assert.deepEqual(Object.keys(a).sort(), Object.keys(b).sort());
  for (const k of Object.keys(a)) assert.ok(Math.abs(a[k] - b[k]) <= 20 * 60, `${k} moved ${Math.round((a[k] - b[k]) / 60)} min`);
  // switched off: he's back the next day with the games
  setHoldem({ on: false });
  assert.ok(kinds('2026-11-12').includes('billposter'));
  reset();
});

test('&force=billboard-holdem (a preview on this phone) wins over the switch, NOW OPEN by &holdem=open', () => {
  reset(); setHoldem({ on: false });
  setHoldemForce({ since: '2026-11-08', bar: 'open' });
  assert.equal(holdemState().src, 'force');
  assert.equal(holdemShow('2026-11-08'), 'holdem-open');
  reset();
});

test('the messages still interrupt: HOLD\'EM is no hint row; the day chart shows the base poster', () => {
  reset();
  assert.ok(!billboardRows().some(r => r.id === 'billboard.holdem'), 'not in the hint queue (the hints run first, then the base)');
  const C = dayChart('2026-11-12', { seed: 1924 });
  const it = C.items.find(i => /BASE POSTER: TEXAS HOLD/.test(i.label));
  assert.ok(it && /COMING SOON/.test(it.label) && /no billposter today/.test(it.label), it && it.label);
});
