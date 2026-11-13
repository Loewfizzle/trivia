// THE STREAK (PROGRESSION A): the 4 am day, freezes (day 3, then every 7, hold 2, automatic), WIN IT BACK (3 plays within 3 days, once a
// month), THE OUTAGE, the milestones, the view the screens read.
import '../api/_lib/catalog.js';   // (THE VAULT 1B: the server-only catalog — names, rewards, achievements)
import test from 'node:test';
import assert from 'node:assert/strict';
import { streakDay, streakPlay, streakView, dayNum, dayOf, MILESTONES, FREEZE } from '../js/core/streak.js';

const ET = (y, m, d, hh, mm = 0) => Date.UTC(y, m - 1, d, hh + 5, mm);   // Eastern standard time (Nov+) → UTC
const D = n => dayOf(dayNum('d20261110') + n);                           // day 0 = Tue Nov 10 2026

test('the day turns at 4 am Eastern', () => {
  assert.equal(streakDay(ET(2026, 11, 10, 3, 59)), 'd20261109', '3:59 am still counts for the night before');
  assert.equal(streakDay(ET(2026, 11, 10, 4, 0)), 'd20261110');
  assert.equal(streakDay(ET(2026, 11, 10, 23, 59)), 'd20261110');
  assert.equal(streakDay(ET(2026, 11, 11, 1, 30)), 'd20261110', 'a 1:30 am match is the evening it started');
  assert.equal(dayOf(dayNum('d20261231') + 1), 'd20270101');
});

const run = (days, outage) => { let st = null; const evs = []; for (const d of days) { const r = streakPlay(st, d, outage); st = r.st; evs.push(r.ev); } return { st, evs }; };

test('a run grows a day a night; the same night twice is one day', () => {
  const { st, evs } = run([D(0), D(0), D(1), D(2)]);
  assert.equal(st.n, 3); assert.equal(st.b, 3);
  assert.deepEqual(evs.map(e => e.first), [true, false, true, true]);
});

test('FREEZES: the first on day 3, then every 7 more; hold 2; used automatically on a missed day', () => {
  let { st, evs } = run([D(0), D(1), D(2)]);
  assert.equal(st.f, 1); assert.equal(evs[2].freezes, 1);
  ({ st } = run(Array.from({ length: 10 }, (_, i) => D(i))));
  assert.equal(st.n, 10); assert.equal(st.f, 2, 'day 3 + day 10');
  ({ st } = run(Array.from({ length: 17 }, (_, i) => D(i))));
  assert.equal(st.f, FREEZE.hold, 'never more than 2');
  // miss day 10 + 11 → both freezes used, the run goes on
  const r = streakPlay(run(Array.from({ length: 10 }, (_, i) => D(i))).st, D(12));
  assert.equal(r.st.n, 11); assert.equal(r.st.f, 0); assert.deepEqual(r.ev.frozen, [D(10), D(11)]); assert.equal(r.ev.broke, null);
  assert.equal(r.st.h[D(10)], 2);
});

test('the break: more missed days than freezes', () => {
  const r = streakPlay(run([D(0), D(1), D(2), D(3)]).st, D(6));   // 1 freeze, 2 missed
  assert.deepEqual(r.ev.broke, { lost: 4 });
  assert.equal(r.st.n, 1); assert.equal(r.st.f, 0); assert.equal(r.st.b, 4, 'the best is kept');
});

test('WIN IT BACK: 3 plays within 3 days of coming back restores the run — once a month', () => {
  let st = run([D(0), D(1), D(2), D(3), D(4)]).st;   // n 5, 1 freeze
  let r = streakPlay(st, D(8));                        // D5 frozen, D6 breaks; back on D8 (2 days after the break)
  assert.ok(r.ev.offer); assert.equal(r.st.w.k, 1); assert.equal(r.st.n, 1);
  r = streakPlay(r.st, D(8));
  r = streakPlay(r.st, D(9));
  assert.deepEqual(r.ev.restored, { n: 5 + 2, lost: 5 });   // the lost 5 + the two nights played since (FR7 FIXES C: + the run it restores)
  assert.equal(r.st.n, 7); assert.equal(r.st.w, null); assert.equal(r.st.wm, 'm202611');
  assert.equal(r.st.h[D(6)], 4, 'the broken days count as won back');
  // a second break the same month: no offer
  const again = streakPlay(r.st, D(13));
  assert.ok(again.ev.broke && !again.ev.offer && !again.st.w);
  // back too late (4 days after the break): no offer
  const late = streakPlay(run([D(0), D(1), D(2)]).st, D(9));
  assert.ok(late.ev.broke && !late.ev.offer);
  // the window runs out: plays on day 1 and day 4 of it don't restore
  let w = streakPlay(run([D(0), D(1)]).st, D(4));
  assert.ok(w.ev.offer);
  w = streakPlay(w.st, D(7));
  assert.equal(w.st.w, null); assert.equal(w.ev.restored, null);
});

test('THE OUTAGE: a marked day breaks nobody and uses no freeze', () => {
  const st = run([D(0), D(1)]).st;   // no freeze yet
  const r = streakPlay(st, D(3), new Set([D(2)]));
  assert.equal(r.ev.broke, null); assert.deepEqual(r.ev.outage, [D(2)]); assert.equal(r.st.n, 3); assert.equal(r.st.h[D(2)], 3);
  assert.ok(streakPlay(st, D(3)).ev.broke, 'without the outage it breaks');
});

test('MILESTONES: 3 · 7 · 14 · 30 · 50 · 100 (+ a FAVOR) · 200 · 365 — each once', () => {
  assert.deepEqual(MILESTONES.map(m => m.n), [3, 7, 14, 30, 50, 100, 200, 365]);
  const { evs } = run(Array.from({ length: 365 }, (_, i) => D(i)));
  const hit = evs.flatMap((e, i) => e.milestones.map(m => [i + 1, m.n]));
  assert.deepEqual(hit, MILESTONES.map(m => [m.n, m.n]));
  assert.equal(MILESTONES.find(m => m.n === 100).favor, 1);
});

test('the view: lit · waiting · frozen · out (+ WIN IT BACK), the week\'s dots', () => {
  const st = run([D(0), D(1), D(2)]).st;   // Tue–Thu, 1 freeze
  assert.equal(streakView(st, D(2)).state, 'lit');
  assert.equal(streakView(st, D(3)).state, 'waiting');
  const fr = streakView(st, D(4));
  assert.equal(fr.state, 'frozen'); assert.equal(fr.n, 3); assert.equal(fr.freezes, 0);
  const out = streakView(st, D(5));
  assert.equal(out.state, 'out'); assert.equal(out.n, 0); assert.ok(out.winBack && out.winBack.need === 3 && out.winBack.lost === 3);
  assert.equal(streakView(st, D(9)).winBack, null, 'too late to win it back');
  const v = streakView(st, D(3));
  assert.equal(v.week.length, 7);
  assert.deepEqual(v.week.map(x => x.s), ['missed', 'played', 'played', 'played', 'today', 'future', 'future']);   // Mon Nov 9 … Sun Nov 15
  assert.equal(v.full, true); assert.equal(v.nextMilestone, 7);
  assert.deepEqual(streakView(null, D(0)), { n: 0, best: 0, state: 'out', freezes: 0, full: false, week: streakView(null, D(0)).week, winBack: null, nextMilestone: 3 });
  // a carried-over streak from before (no freezes field): still a run
  assert.equal(streakView({ n: 6, d: D(2) }, D(3)).n, 6);
});
