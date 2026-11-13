// HOLD'EM — THE BET STEPS (HE11): the custom bet slider's pure rule (js/games/holdem/bet-steps.js), over every stack × blind level
// in TURBO / DEEP / CASH: the minimum raise reachable exactly, ALL IN reachable exactly (and only at the very end of the track), every
// amount between them round, 30–60 stops whenever the span allows (fewer only when the small blind can't be split finer).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { betStops, betUnit, baseUnit, valueAt, posOf, stepFrom, MAX_STOPS, MIN_STOPS, confirmLock, pointerMay, LOCK_OPEN, LOCK_GRACE_MS, LOCK_MAX_MS } from '../js/games/holdem/bet-steps.js';
import { SPEEDS, CASH, blindsAt, MAX_SEATS } from '../js/games/holdem/structure.js';

const ROUND = new Set();
for (let k = 0; k < 9; k++) for (const m of [1, 2, 2.5, 5]) { const u = m * 10 ** k; if (u >= 5 && Number.isInteger(u)) ROUND.add(u); }

/** Every (minTo, maxTo, sb) a real table can show: a stack from one big blind to every chip at the table, facing nothing or a bet. */
function* cases() {
  const modes = [
    ['turbo', SPEEDS.turbo.stack, 22], ['deep', SPEEDS.deep.stack, 22],
    ['cash', CASH.stack + 6 * CASH.rebuy, 0],            // (CASH: fixed blinds, a stack grown by everyone's rebuys)
  ];
  for (const [mode, stack, levels] of modes) {
    const total = stack * MAX_SEATS;
    for (let lv = 0; lv <= levels; lv++) {
      const { sb, bb } = mode === 'cash' ? { sb: CASH.sb, bb: CASH.bb } : blindsAt(lv);
      for (let have = bb; have <= total; have = Math.ceil(have * 1.18) + 3) {
        for (const facing of [0, bb, 3 * bb, Math.floor(have / 3), Math.floor(have / 2) + 7]) {   // (+7: an odd bet — an all in for less)
          const minTo = facing === 0 ? bb : facing + Math.max(bb, facing);
          if (minTo >= have) continue;                    // (the only raise is ALL IN — the one-stop track below)
          yield { mode, lv, sb, bb, minTo, maxTo: have };
        }
      }
    }
  }
}

test('THE BET STEPS: min + ALL IN exact, every amount between round, 30–60 stops when the span allows', () => {
  let n = 0, fine = 0;
  for (const c of cases()) {
    n++;
    const { unit, stops } = betStops(c);
    const at = `${c.mode} lv${c.lv} ${c.sb}/${c.bb} min ${c.minTo} max ${c.maxTo}`;
    assert.ok(ROUND.has(unit) && unit >= baseUnit(c.sb), `${at}: a round unit ≥ the small blind (${unit})`);
    assert.equal(stops[0], c.minTo, `${at}: the minimum raise is the first stop`);
    assert.equal(stops[stops.length - 1], c.maxTo, `${at}: ALL IN is the last stop`);
    for (let i = 1; i < stops.length; i++) assert.ok(stops[i] > stops[i - 1], `${at}: strictly rising`);
    for (const v of stops.slice(1, -1)) assert.equal(v % unit, 0, `${at}: ${v} is a round amount (× ${unit})`);
    assert.ok(stops.length <= MAX_STOPS, `${at}: ≤ ${MAX_STOPS} stops (${stops.length})`);
    if (unit > baseUnit(c.sb)) { fine++; assert.ok(stops.length >= MIN_STOPS, `${at}: ≥ ${MIN_STOPS} stops (${stops.length}, unit ${unit})`); }
    // the gap to ALL IN is never more than one unit, and never a jump past it (ALL IN only by reaching the end)
    assert.ok(c.maxTo - stops[stops.length - 2] <= unit, `${at}: the last step to ALL IN is at most one unit`);
  }
  assert.ok(n > 2000 && fine > 500, `enough cases (${n}, ${fine} with a grown unit)`);
});

test('THE TRACK: ALL IN only in the last half-slice; every stop reachable; posOf ↔ valueAt round-trip', () => {
  for (const c of [{ minTo: 40, maxTo: 1500, sb: 10 }, { minTo: 337, maxTo: 2984, sb: 50 }, { minTo: 20, maxTo: 7000, sb: 5 }, { minTo: 100, maxTo: 260, sb: 50 }]) {
    const { stops } = betStops(c), k = stops.length - 1;
    stops.forEach((v, i) => { assert.equal(valueAt(stops, i / k), v); assert.equal(posOf(stops, v), i / k); });
    assert.equal(valueAt(stops, 1), c.maxTo);
    assert.equal(valueAt(stops, 1.4), c.maxTo, 'a finger past the end = ALL IN');
    assert.equal(valueAt(stops, -0.2), c.minTo, 'a finger before the start = the minimum');
    assert.notEqual(valueAt(stops, (k - 0.5) / k - 1e-9), c.maxTo, 'just before the last half-slice is NOT all in');
    // a drag across: monotonic, no stop skipped, never back
    const seen = [];
    for (let px = 0; px <= 600; px++) { const v = valueAt(stops, px / 600); if (seen[seen.length - 1] !== v) seen.push(v); }
    assert.deepEqual(seen, stops, 'a slow drag across visits every stop once, in order');
  }
});

test('− / +: one stop each; a preset between stops steps to its neighbours; held at the ends', () => {
  const { stops, unit } = betStops({ minTo: 40, maxTo: 1500, sb: 10 });
  assert.equal(unit, 25);
  assert.equal(stepFrom(stops, 40, +1), 50);
  assert.equal(stepFrom(stops, 50, -1), 40);
  assert.equal(stepFrom(stops, 40, -1), 40);
  assert.equal(stepFrom(stops, 1500, +1), 1500);
  assert.equal(stepFrom(stops, 1475, +1), 1500);
  assert.equal(stepFrom(stops, 335, +1), 350);            // (½ POT = 335: between 325 and 350)
  assert.equal(stepFrom(stops, 335, -1), 325);
  const p = posOf(stops, 335);
  assert.ok(p > posOf(stops, 325) && p < posOf(stops, 350), 'a preset sits between its neighbours on the track');
});

test('a short stack: one stop (ALL IN), or every small blind when the span is short', () => {
  assert.deepEqual(betStops({ minTo: 600, maxTo: 600, sb: 100 }).stops, [600]);
  assert.equal(valueAt([600], 0.3), 600);
  const s = betStops({ minTo: 40, maxTo: 130, sb: 10 });
  assert.equal(s.unit, 10);
  assert.deepEqual(s.stops, [40, 50, 60, 70, 80, 90, 100, 110, 120, 130]);
  assert.equal(betUnit(40, 130, 15), 20, 'a 15 small blind → 20s');
});

// THE CONFIRM LOCK + THE ONE POINTER (the slider's review, Nov 13 — bet-slider.js runs them; wk-holdem-slider.mjs proves them in WebKit)
test('THE CONFIRM LOCK: one send per open panel; a refusal opens it, a yes holds it, a timeout always opens it, a stale answer never does', () => {
  let r = confirmLock(LOCK_OPEN, { type: 'tap' });
  assert.equal(r.send, true, 'the first CONFIRM sends');
  assert.deepEqual(r.gate, { lock: 'sent', n: 1 });
  const sent = r.gate;
  for (let i = 0; i < 5; i++) {
    r = confirmLock(sent, { type: 'tap' });
    assert.equal(r.send, false, 'a second tap while sent sends nothing');
    assert.equal(r.gate, sent);
  }
  // a refusal / no signal → open at once, and the next tap sends (n + 1)
  r = confirmLock(sent, { type: 'fail', n: 1 });
  assert.equal(r.gate.lock, 'open');
  r = confirmLock(r.gate, { type: 'tap' });
  assert.equal(r.send, true);
  assert.equal(r.gate.n, 2);
  // a late answer to the FIRST confirm never touches the second
  assert.equal(confirmLock(r.gate, { type: 'fail', n: 1 }).gate, r.gate);
  assert.equal(confirmLock(r.gate, { type: 'timeout', n: 1 }).gate, r.gate);
  // the dealer said yes → still locked (answered); taps still send nothing; the grace timeout opens it
  const ans = confirmLock(r.gate, { type: 'ok', n: 2 }).gate;
  assert.deepEqual(ans, { lock: 'answered', n: 2 });
  assert.equal(confirmLock(ans, { type: 'tap' }).send, false, 'answered, the table not yet moved: no second send');
  assert.equal(confirmLock(ans, { type: 'ok', n: 2 }).gate, ans);
  assert.equal(confirmLock(ans, { type: 'timeout', n: 2 }).gate.lock, 'open', 'the grace / cap timeout opens it — it never sticks');
  // the cap opened it before the answer came: the late yes / no changes nothing (never re-locks an open panel)
  const open = confirmLock({ lock: 'sent', n: 3 }, { type: 'timeout', n: 3 }).gate;
  assert.equal(open.lock, 'open');
  assert.equal(confirmLock(open, { type: 'ok', n: 3 }).gate, open);
  assert.equal(confirmLock(open, { type: 'fail', n: 3 }).gate, open);
  // junk in: nothing changes, nothing sent
  assert.equal(confirmLock(ans, null).gate, ans);
  assert.equal(confirmLock(ans, { type: 'what', n: 2 }).send, false);
  assert.equal(confirmLock(undefined, { type: 'tap' }).send, true, 'no gate yet = open');
  assert.ok(LOCK_GRACE_MS > 0 && LOCK_MAX_MS >= LOCK_GRACE_MS);
});

test('THE ONE POINTER: only the owning finger acts; a free slider takes any', () => {
  assert.equal(pointerMay(null, 7), true);
  assert.equal(pointerMay(undefined, 1), true);
  assert.equal(pointerMay(1, 1), true);
  assert.equal(pointerMay(1, 2), false, 'a second finger never moves the thumb');
  assert.equal(pointerMay(0, 0), true, 'pointerId 0 (a mouse in some engines) is a real owner');
  assert.equal(pointerMay(0, 1), false);
});
