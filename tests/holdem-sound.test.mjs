// HOLD'EM (HE5) — THE SOUNDS: the event → sound map (sound-plan.js, PURE — from the motion's own timeline), the deals spaced + varied, one
// sound per event, nothing on a refresh, the gain table (Ben's balance) + the files, the tick, the winner sound flag. Silent: no audio here.
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, statSync } from 'node:fs';
import { soundPlan, tickSecond, DEAL_MIN_GAP } from '../js/games/holdem/sound-plan.js';
import { schedule, freshEvents, BEAT } from '../js/games/holdem/motion-plan.js';
import { GAIN, FILES, LIMITER, TRIM, DEAL_VARY, OFFSET } from '../js/games/holdem/sfx.js';
import { OWN_VICTORY_SOUND, MUSIC } from '../js/games/holdem/meta.js';
import { newRecord, applyOp, advance, publicOf } from '../api/_lib/holdem-dealer.js';
import { legalActions, running } from '../js/games/holdem/table.js';
import { rngFrom } from '../js/core/rng.js';

const ev = (n, t, at, x = {}) => ({ n, t, hand: 1, at, ...x });
const names = cues => cues.map(c => c.name);

test('THE BALANCE (Ben): the new set at 2.2 · the kept stings at 1.0 · the deals ~half (1.1) · a soft limiter at −6 dB; 17 files, no beds', () => {
  for (const n of ['shuffle', 'flip', 'fold', 'check', 'chip-bet', 'chip-raise', 'chip-stack', 'all-in', 'pot-win']) assert.equal(GAIN[n], 2.2, n);
  for (const n of ['your-turn', 'timer-tick', 'showdown', 'hand-win', 'knockout', 'blinds-up', 'champion']) assert.equal(GAIN[n], 1, n);
  assert.equal(GAIN.deal, 1.1);
  assert.ok(Math.abs(20 * Math.log10(GAIN.deal / GAIN.shuffle) + 6) < 0.1, 'the deals ≈ −6 dB from the new set');
  assert.equal(LIMITER.threshold, -6);
  assert.ok(TRIM > 0.6 && TRIM <= 1, 'the trim takes the compressor\'s make-up gain back out');
  assert.deepEqual(DEAL_VARY, { rate: 0.04, vol: [0.85, 1] });
  assert.equal(FILES.length, 17);
  let total = 0;
  for (const f of FILES) { assert.ok(existsSync(`audio/holdem/${f}.mp3`), f); total += statSync(`audio/holdem/${f}.mp3`).size; }
  assert.deepEqual(readdirSync('audio/holdem').filter(f => /bed/i.test(f)), [], 'THE AMBIENT BEDS ARE CANCELLED');
  assert.deepEqual(readdirSync('audio/holdem').filter(f => !FILES.includes(f.replace(/\.mp3$/, ''))), [], 'nothing unused shipped (deal-b / chip-bet-b / all-in-b stay on Ben\'s PC)');
  assert.ok(total < 400_000, `the sounds ${Math.round(total / 1024)} KB`);
  assert.deepEqual(OFFSET, {}, 'every lead-in measured ≤ 6 ms — nothing skipped');
  assert.equal(OWN_VICTORY_SOUND, true, 'ONE winner sound: HOLD\'EM\'s champion (the console\'s sting skipped)');
  assert.equal(MUSIC, 'mood:late');
});

test('THE EVENT MAP: a new hand → shuffle + a deal per card (≥ 110 ms apart, ±4 % rate, 0.85–1.0 volume); fold · check · call · raise · all in; the board flips; your flip', () => {
  const ids = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const steps = schedule([ev(1, 'dealt', 0, { ids, button: 'a' }), ev(2, 'posted', 0, { id: 'b', amount: 10 }), ev(3, 'posted', 0, { id: 'c', amount: 20 })], { heroId: 'd', k: 7 });
  const cues = soundPlan(steps, { me: 'd', rng: rngFrom('deal') });
  assert.equal(cues[0].name, 'shuffle');
  const deals = cues.filter(c => c.name === 'deal');
  assert.equal(deals.length, 16, '16 cards → 16 deals');
  for (let i = 1; i < deals.length; i++) assert.ok(deals[i].at - deals[i - 1].at >= DEAL_MIN_GAP, 'never smeared together');
  assert.ok(deals[0].at >= BEAT.dealLead, 'after the shuffle starts');
  assert.ok(deals.every(d => d.rate >= 0.96 && d.rate <= 1.04 && d.vol >= 0.85 && d.vol <= 1), 'the variety stays inside ±4 % / 0.85–1.0');
  assert.ok(new Set(deals.map(d => d.rate)).size > 8, 'no two deals in a row the same — never robotic');
  assert.equal(names(cues).filter(n => n === 'chip-bet').length, 2, 'the blinds');
  assert.equal(names(cues).filter(n => n === 'flip').length, 1, 'your own flip, once');
  const act = schedule([ev(4, 'folded', 0, { id: 'e' }), ev(5, 'checked', 0, { id: 'f' }), ev(6, 'called', 0, { id: 'g', amount: 20, to: 20 }), ev(7, 'raised', 0, { id: 'h', amount: 60, to: 60 }), ev(8, 'allin', 0, { id: 'a', amount: 1500, to: 1500 })], {});
  assert.deepEqual(names(soundPlan(act, { rng: Math.random })), ['fold', 'check', 'chip-bet', 'chip-raise', 'all-in']);
  const flop = schedule([ev(9, 'street', 0, { street: 'flop', cards: ['As', 'Kd', '2c'], board: ['As', 'Kd', '2c'] })], {});
  assert.deepEqual(names(soundPlan(flop, {})), ['flip', 'flip', 'flip'], 'each board card flipped');
});

test('THE SHOWDOWN + THE POTS: the reveal → showdown once; each pot → pot-win; YOU win → hand-win once; anyone OUT → knockout; BLINDS UP; YOUR rebuy → chip-stack', () => {
  const pots = [{ pot: 0, amount: 900, winners: [{ id: 'me', amount: 900 }] }, { pot: 1, side: true, amount: 400, winners: [{ id: 'b', amount: 400 }] }, { pot: 2, side: true, amount: 200, winners: [{ id: 'me', amount: 200 }] }];
  const list = [ev(1, 'shown', 0, { id: 'b' }), ev(2, 'shown', 0, { id: 'c' }), ev(3, 'shown', 0, { id: 'me' }),
    ...pots.map((p, i) => ev(4 + i, 'pot', 0, p)), ev(7, 'out', 0, { id: 'c', place: 3 }), ev(8, 'level', 0, { sb: 25, bb: 50 })];
  const n = names(soundPlan(schedule(list, {}), { me: 'me' }));
  assert.equal(n.filter(x => x === 'showdown').length, 1);
  assert.equal(n.filter(x => x === 'pot-win').length, 3, 'one per pot');
  assert.equal(n.filter(x => x === 'hand-win').length, 1, 'your win, once');
  assert.equal(n.filter(x => x === 'knockout').length, 1);
  assert.equal(n.filter(x => x === 'blinds-up').length, 1);
  assert.ok(!n.includes('flip'), 'the showdown\'s hands turn up under the sting — no flip clatter');
  assert.deepEqual(names(soundPlan(schedule([ev(1, 'shown', 0, { id: 'w', byChoice: true })], {}), {})), ['flip'], 'a fold-win\'s SHOW = a flip');
  assert.deepEqual(names(soundPlan(schedule([ev(1, 'rebuy', 0, { id: 'me' })], {}), { me: 'me' })), ['chip-stack']);
  assert.deepEqual(names(soundPlan(schedule([ev(1, 'rebuy', 0, { id: 'b' })], {}), { me: 'me' })), [], 'someone else\'s rebuy: quiet');
});

test('NEVER A REPLAY: a refresh (the first look) plans nothing; a stale or gapped run plans nothing; only the fresh events sound, once', () => {
  const evs = [ev(1, 'folded', 1000, { id: 'a' }), ev(2, 'checked', 1100, { id: 'b' })];
  assert.deepEqual(freshEvents(evs, null, 1200).list, [], 'a mount / refresh');
  assert.deepEqual(freshEvents(evs, 0, 1200 + 10_000).list, [], 'stale');
  assert.deepEqual(freshEvents([evs[1]], 0, 1200).list, [], 'a gap');
  const f = freshEvents(evs, 1, 1200);
  assert.deepEqual(names(soundPlan(schedule(f.list, {}), {})), ['check'], 'only what this phone hasn\'t heard');
  assert.deepEqual(freshEvents(evs, f.seen, 1300).list, [], 'the same events again → silence');
});

test('THE TICK: the last 5 s of your clock, once a second 5 → 1; nothing before', () => {
  assert.equal(tickSecond(9000), 0);
  assert.equal(tickSecond(5000), 5);
  assert.equal(tickSecond(4001), 5);
  assert.equal(tickSecond(4000), 4);
  assert.equal(tickSecond(120), 1);
  assert.equal(tickSecond(0), 0);
});

test('A WHOLE MATCH through the real dealer: every fresh run plans only known sounds, one deal per card dealt, one pot-win per pot', () => {
  const rng = rngFrom('he5-sound');
  const uids = ['p0', 'p1', 'p2', 'p3', 'p4', 'p5'];
  let now = 1e12, seen = 0, deals = 0, cards = 0, pots = 0, potWins = 0;
  const rec = newRecord({ code: 'SNDS', uids, now, rng });
  advance(rec, now, rng);
  for (let g = 0; g < 3000 && !rec.m.ended; g++) {
    const t = rec.m.table;
    if (running(t) && !t.runout) {
      const L = legalActions(t), r = rng();
      now += 2000;
      const action = r < 0.15 ? 'allin' : r < 0.45 ? 'fold' : L.canCheck ? 'check' : 'call';
      try { applyOp(rec, 'act', L.id, { hand: t.hand, seq: rec.seq, action }, { now, rng }); } catch { applyOp(rec, 'act', L.id, { hand: t.hand, seq: rec.seq, action: 'fold' }, { now, rng }); }
    } else { now += 1600; advance(rec, now, rng); }
    const pub = publicOf(rec);
    const f = freshEvents(pub.ev, seen, now);
    seen = f.seen;
    const cues = soundPlan(schedule(f.list, { heroId: 'p0' }), { me: 'p0', rng });
    for (const c of cues) assert.ok(GAIN[c.name], `a known sound: ${c.name}`);
    deals += cues.filter(c => c.name === 'deal').length;
    cards += f.list.filter(e => e.t === 'dealt').reduce((n, e) => n + 2 * e.ids.length, 0);
    pots += f.list.filter(e => e.t === 'pot').length;
    potWins += cues.filter(c => c.name === 'pot-win').length;
  }
  assert.ok(rec.m.ended, 'the match ended');
  assert.equal(deals, cards, 'one deal sound per card dealt');
  assert.equal(potWins, pots, 'one pot-win per pot');
});
