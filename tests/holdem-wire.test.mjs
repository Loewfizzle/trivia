// HOLD'EM (HE3) — THE LEAN WIRE (js/games/holdem/wire.js): the public view as small parts, only the changed ones written. Whole tables
// played by THE TEST ROBOTS through the dealer's pure core: after EVERY step the parts round-trip to the same view, the diff applied to the
// old parts gives the new ones exactly, a typical action costs a few hundred bytes, and THE WALK INSIDE (start's dealAt) holds hand 1.
import test from 'node:test';
import assert from 'node:assert/strict';
import { newRecord, applyOp, advance, dueOf, publicOf } from '../api/_lib/holdem-dealer.js';
import { toWire, wireDiff, nestWire, fromWire, wireBytes } from '../js/games/holdem/wire.js';
import { legalActions, running } from '../js/games/holdem/table.js';
import { SHOT_MS } from '../js/games/holdem/structure.js';
import { decide } from './fixtures/holdem-bots.mjs';
import { rngFrom } from '../js/core/rng.js';

const T0 = 1_800_000_000_000;
const norm = v => JSON.parse(JSON.stringify(v));
/** what a phone's listener holds after a whole-node write, then each diff (Firebase's own merge: a null deletes) */
function applyDiff(node, diff, seq) {
  const out = norm(node);
  for (const [path, v] of Object.entries(diff)) {
    const parts = path.split('/');
    let o = out;
    for (const k of parts.slice(0, -1)) o = (o[k] ||= {});
    if (v == null) delete o[parts.at(-1)]; else o[parts.at(-1)] = v;
  }
  out.seq = seq;
  return out;
}

function playTable({ n, mode = 'tournament', seed, steps = 4000 }) {
  const rng = rngFrom(seed), brain = rngFrom(`${seed}:bots`);
  const uids = Array.from({ length: n }, (_, i) => `p${i}`);
  const rec = newRecord({ code: 'WIRE', uids, mode, now: T0, rng });
  let now = T0;
  advance(rec, now, rng);
  let pub = norm(publicOf(rec)), node = { seq: rec.seq, ...nestWire(toWire(pub)) };
  const costs = [];
  for (let i = 0; i < steps && !rec.m.ended; i++) {
    const t = rec.m.table, L = running(t) && !t.runout ? legalActions(t) : null;
    now += 1500;
    if (L) {
      const me = t.seats.find(x => x.id === L.id);
      const a = decide({ ...t, mine: me.cards }, L, brain, ['tight', 'loose', 'station', 'maniac'][i % 4]);
      const action = a.type === 'bet' || a.type === 'raise' ? 'raise' : a.type;
      try { applyOp(rec, 'act', L.id, { hand: t.hand, seq: rec.seq, action, amount: a.to }, { now, rng }); } catch { advance(rec, now + SHOT_MS * 3, rng); }
    } else { now = Math.max(now, dueOf(rec) ?? now); advance(rec, now, rng); }
    const next = norm(publicOf(rec));
    if (next.seq === pub.seq && JSON.stringify(next) === JSON.stringify(pub)) continue;
    rec.seq = pub.seq + 1;
    const fresh = norm(publicOf(rec));
    const d = wireDiff(pub, fresh);
    node = applyDiff(node, d, rec.seq);
    // the phone's copy, rebuilt from the parts = the server's view, exactly
    assert.deepEqual(fromWire(node), { ...norm(fresh), seq: rec.seq });
    const newEv = fresh.ev.filter(e => e.n > (pub.ev.at(-1)?.n || 0)).map(e => e.t);
    costs.push({ kinds: newEv, diff: wireBytes(Object.fromEntries(Object.entries(d).map(([k, v]) => [`rooms/WIRE/holdem/${k}`, v]))) + 60, full: wireBytes({ seq: rec.seq, at: now, j: JSON.stringify(fresh) }) });
    pub = fresh;
  }
  return { rec, costs };
}

test('THE LEAN WIRE: the parts round-trip to the same view; every diff applied to the old parts = the new view (tournaments 2 / 5 / 8, CASH 4)', () => {
  for (const [n, mode] of [[2, 'tournament'], [5, 'tournament'], [8, 'tournament'], [4, 'cash']]) {
    const { costs } = playTable({ n, mode, seed: `wire-${n}-${mode}`, steps: mode === 'cash' ? 600 : 4000 });
    assert.ok(costs.length > 50, `${n} ${mode}: ${costs.length} writes`);
  }
});

test('THE LEAN WIRE: a typical action costs a few hundred bytes (was ~5 KB): fold, call, raise, a street, a new hand', () => {
  const all = [];
  for (const s of ['c1', 'c2', 'c3']) all.push(...playTable({ n: 8, seed: `cost-${s}` }).costs);
  const med = (list, f) => { const v = list.map(f).sort((a, b) => a - b); return v[Math.floor(v.length / 2)] || 0; };
  const kind = k => all.filter(c => c.kinds.includes(k) && (k === 'dealt' || !c.kinds.includes('dealt')) && (['street', 'dealt', 'pot'].includes(k) || (!c.kinds.includes('street') && !c.kinds.includes('pot'))));
  const rows = {};
  for (const k of ['folded', 'called', 'raised', 'checked', 'street', 'pot', 'dealt']) rows[k] = { n: kind(k).length, before: med(kind(k), c => c.full), after: med(kind(k), c => c.diff) };
  console.log('# holdem wire bytes (median, 8 players): ' + Object.entries(rows).map(([k, r]) => `${k} ${r.before} → ${r.after} B`).join(' · '));
  for (const k of ['folded', 'called', 'raised', 'checked']) assert.ok(rows[k].after < 700, `${k}: ${rows[k].after} B a write`);
  assert.ok(rows.dealt.after < rows.dealt.before, 'a new hand is cheaper than the whole view');
});

test('THE WALK INSIDE (HE3): start\'s dealAt holds hand 1 until then; the level clock starts there; the console\'s matchId is the id', () => {
  const rng = rngFrom('walk');
  const rec = newRecord({ code: 'WALK', uids: ['a', 'b', 'c'], now: T0, rng, dealAt: T0 + 5000, id: 'q1abc' });
  advance(rec, T0, rng);
  assert.equal(rec.id, 'q1abc');
  assert.equal(rec.m.table.hand, 0, 'nothing dealt during the walk');
  assert.equal(dueOf(rec), T0 + 5000, 'the first deal is due when the match begins');
  assert.equal(rec.m.startAt, T0 + 5000);
  advance(rec, T0 + 4999, rng);
  assert.equal(rec.m.table.hand, 0);
  advance(rec, T0 + 5000, rng);
  assert.equal(rec.m.table.hand, 1);
  assert.equal(dueOf(rec), T0 + 5000 + SHOT_MS);
  assert.equal(fromWire(null), null);
  assert.equal(fromWire({ seq: 3 }), null, 'a node without parts (an older client\'s write) reads as nothing');
});
