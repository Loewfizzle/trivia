// CITY D — THE ROOF BOARD: THE DROP never joined the rotation (the owner's iPhone after CITY C — THE DROP live on his daily screen, the board
// turning HOLD'EM ↔ JAYWALK only). The chain walked on the emulators: progress/dlive.drop + the switch → dailies.js#goLive → radioPublic.drop →
// the cached GET → setDrop / nd:drop → all fine ('2026-11-15'); the break was the LAST link — the scene judged THE DROP's window on the board's
// own day key, its WORK DAY (still '2026-11-14' until the billposter's evening turn), so on its go-live day the face was a day early and
// dropped. Now the scene passes its clock: THE DROP is judged on the 4 am ET streak day (harbor-trivision.js#dropKey).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { setDrop, setJaywalk, setDropForce, triFaces, dropKey } from '../js/core/harbor-trivision.js';
import { goLiveDay, nextLiveDay, rowOpenOn, dailyRow } from '../js/core/daily.js';

const at = iso => Date.parse(iso);   // (an instant)

test('CITY D: a daily turned on (GO LIVE AT THE NEXT 4 AM — the only way an OFF row turns on) → the face joins the rotation on its go-live morning', () => {
  setJaywalk(null); setDropForce(null);
  // the owner taps GO LIVE AT THE NEXT 4 AM on Nov 14, 3 pm ET → from = the next streak day
  const from = nextLiveDay(at('2026-11-14T20:00:00Z'));
  assert.equal(from, 'd20261115');
  const row = dailyRow('drop');
  assert.ok(row && row.on === false, 'THE DROP ships OFF');
  assert.equal(rowOpenOn(row, { from }, 'd20261115'), true, 'it plays from that morning');
  // the server's day for the feed (dailies.js#goLive) — the switch on + the schedule → the feed's live = '2026-11-15'
  const d = goLiveDay({ row, switchOn: true, sched: { from }, onDay: null, firstDay: null, today: 'd20261115' });
  assert.equal(d, 'd20261115');
  setDrop({ live: '2026-11-15', mode: 'on' });
  // Nov 15, 9:40 am ET — the board's WORK DAY is still Nov 14
  const now = at('2026-11-15T14:40:00Z');
  assert.deepEqual(triFaces('2026-11-14'), ['holdem-open', 'jaywalk'], 'the board\'s key alone (the old judging): THE DROP a day early — the bug');
  assert.deepEqual(triFaces('2026-11-14', now), ['holdem-open', 'jaywalk', 'drop'], 'judged on the streak day: THE DROP is in the rotation');
  assert.equal(dropKey('2026-11-14', now), '2026-11-15');
  assert.equal(dropKey('2026-11-16', now), '2026-11-16', 'a later board key stands');
  assert.equal(dropKey('2026-11-14', null), '2026-11-14', 'no clock: the key alone (the day chart, fixed-day tests)');
  // before 4 am ET the streak day is still the 14th: not live yet
  assert.deepEqual(triFaces('2026-11-14', at('2026-11-15T08:30:00Z')), ['holdem-open', 'jaywalk'], '3:30 am ET: not yet');
  // 14 days counted from the go-live: retired on the 29th's streak day
  assert.deepEqual(triFaces('2026-11-28', at('2026-11-29T14:00:00Z')), ['holdem-open', 'jaywalk'], 'retired after its 14 days');
  setDrop(null);
});

test('CITY D: the scene hands the board its clock; the order and the shared clock unchanged (HOLD\'EM → JAYWALK → THE DROP)', () => {
  const sc = readFileSync('js/screens/harbor/scene.js', 'utf8');
  assert.match(sc, /const F = key \? triFaces\(key, clock\.now\(\)\) : null/);
  const T = readFileSync('js/core/harbor-trivision.js', 'utf8');
  assert.match(T, /\[holdemShow\(dayKey\), jaywalkShow\(dayKey\), dropShow\(dropKey\(dayKey, nowMs\)\)\]/);
});
