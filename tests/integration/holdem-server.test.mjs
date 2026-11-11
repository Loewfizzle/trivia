// HOLD'EM (HE2) — FULL MATCHES THROUGH THE SERVER DEALER, on the emulators (database :9000 + auth :9099):
//   cd tests/integration && npm run emulators        (another terminal; Java)
//   node --test holdem-server.test.mjs               (≈ 1–2 min; run it ALONE — it loads the real rules into the dealer's namespace)
// The REAL api handler's work (api/_lib/holdem-store.js#holdemAction — what POST /api/report { holdem } runs after the token check; one
// HTTP test goes through the handler with real emulator ID tokens) driven by 2–8 fake signed-in phones, a SEEDED "server rng" + a test
// clock (emulator-only hooks: production stays crypto + Date.now()). THE LEAK SCAN: at every step, everything phone B is ALLOWED to read
// (the rules, read AS B through @firebase/rules-unit-testing) is deep-scanned for another seat's unshown cards + every undealt card.
process.env.FIREBASE_DATABASE_EMULATOR_HOST ||= '127.0.0.1:9000';
process.env.FIREBASE_AUTH_EMULATOR_HOST ||= '127.0.0.1:9099';
process.env.GCLOUD_PROJECT ||= 'demo-arcade';
process.env.MATCH_GAP_MS = '0';
process.env.BOARD_MIN_MATCHES = '1';
process.env.ADMIN_PIDS = '';

import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { deleteApp } from 'firebase-admin/app';
import { initializeTestEnvironment, assertFails } from '@firebase/rules-unit-testing';
import { ref as cref, get as cget } from 'firebase/database';
import { ref, val, fb } from '../../api/_lib/fb.js';
import { ApiError } from '../../api/_lib/http.js';
import { holdemAction, startOpen, setTestRng, setTestClock, forgetHoldemBudgets, CALLS, wireStats } from '../../api/_lib/holdem-store.js';
import { PAUSE } from '../../api/_lib/holdem-dealer.js';
import reportHandler from '../../api/report.js';
import { profileAction } from '../../api/profile.js';
import { legalActions } from '../../js/games/holdem/table.js';
import { publicView } from '../../js/games/holdem/views.js';
import { GAMES } from '../../js/config.js';
import { fromWire } from '../../js/games/holdem/wire.js';
import { SHOT_MS, BANK_MS } from '../../js/games/holdem/structure.js';
import { decide } from '../fixtures/holdem-bots.mjs';
import { rngFrom } from '../../js/core/rng.js';

const rules = readFileSync(fileURLToPath(new URL('../../database.rules.json', import.meta.url)), 'utf8');
const NS = `${process.env.GCLOUD_PROJECT}-default-rtdb`;      // the namespace the server (fb.js) writes
let env;
let clock = Date.UTC(2026, 10, 10, 23, 0, 0);
const COST = { calls: 0, cpu: 0, wall: 0, hands: 0, byOp: {}, pub: 0, rec: 0, hole: 0, n: 0 };

before(async () => {
  env = await initializeTestEnvironment({ projectId: NS, database: { rules, host: '127.0.0.1', port: 9000 } });
  setTestClock(() => clock);
  await ref('/').update(Object.fromEntries(['hrec', 'hole', 'rooms', 'results', 'rl', 'profiles', 'uids', 'pstats', 'ppriv', 'pkeys', 'tags', 'lb', 'seats', 'members', 'audit'].map(n => [n, null])));
});
after(async () => {
  setTestRng(null); setTestClock(null);
  if (COST.calls) {
    const per = Object.entries(COST.byOp).map(([k, v]) => `${k} ${v.n} × ${(v.cpu / v.n).toFixed(2)} ms`).join(' · ');
    if (wireStats.length) {
      // (HE3 — THE LEAN WIRE: what one publish costs every listening phone, by the move it carried — the median diff vs the old whole view)
      const med = a => { const v = a.slice().sort((x, y) => x - y); return v[Math.floor(v.length / 2)] || 0; };
      const only = k => wireStats.filter(w => !w.whole && w.kinds.includes(k) && (k === 'dealt' || !w.kinds.includes('dealt')) && (['street', 'dealt', 'pot'].includes(k) || (!w.kinds.includes('street') && !w.kinds.includes('pot'))));
      const rows = ['folded', 'checked', 'called', 'raised', 'street', 'pot', 'dealt'].map(k => { const w = only(k); return `${k} ${med(w.map(x => x.full))} → ${med(w.map(x => x.diff))} B (${w.length})`; });
      const all = wireStats.filter(w => !w.whole);
      console.log(`# holdem wire (a publish, median): ${rows.join(' · ')} — all ${all.length}: ${Math.round(all.reduce((s, w) => s + w.full, 0) / all.length)} → ${Math.round(all.reduce((s, w) => s + w.diff, 0) / all.length)} B average; whole writes ${wireStats.length - all.length}`);
    }
    if (COST.n) console.log(`# holdem bytes: the public view ${Math.round(COST.pub / COST.n)} B, the record ${Math.round(COST.rec / COST.n)} B, a seat's private node ${Math.round(COST.hole / COST.n)} B (averages over ${COST.n} steps)`);
    console.log(`# holdem cost: ${COST.calls} calls over ${COST.hands} hands (${(COST.calls / Math.max(1, COST.hands)).toFixed(1)} a hand), CPU ${(COST.cpu / COST.calls).toFixed(2)} ms a call (wall ${(COST.wall / COST.calls).toFixed(1)} ms on the emulator) — ${per}`);
  }
  await env.cleanup();
  await deleteApp(fb().app);
});

const asPhone = uid => env.authenticatedContext(uid).database();
const phoneRead = async (uid, path) => (await cget(cref(asPhone(uid), path))).val();
let codeN = 0;
const nextCode = () => { codeN++; return `H${'ABCDEFGHJKLMNPQRSTUVWXYZ'[Math.floor(codeN / 24) % 24]}${'ABCDEFGHJKLMNPQRSTUVWXYZ'[codeN % 24]}E`; };

/** every string anywhere in a value — a JSON string is opened and scanned too (the public view travels as one) */
function strings(v, out = []) {
  if (typeof v === 'string') {
    if (v.startsWith('{') || v.startsWith('[')) { try { strings(JSON.parse(v), out); return out; } catch { /* plain text */ } }
    out.push(v);
  } else if (Array.isArray(v)) v.forEach(x => strings(x, out));
  else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) { out.push(k); strings(x, out); }
  return out;
}

class Table {
  constructor(uids, { seed = 'he2', styles = {}, host } = {}) {
    this.code = nextCode();
    this.uids = uids;
    this.host = host || uids[0];
    this.styles = styles;
    this.brains = {};
    this.calls = 0;
    this.scans = 0;
    this.gone = new Set();                       // players who left the room: their seat is run by the clock
    this.cost = true;
    setTestRng(rngFrom(`${seed}:server`));
    this.rng = rngFrom(`${seed}:phones`);
  }
  async seed(extra = []) {
    const players = {};
    [...this.uids, ...extra].forEach((u, i) => { players[u] = { name: u.toUpperCase(), color: 'cyan', avatar: 'bolt', joinedAt: i }; });
    await ref(`rooms/${this.code}`).set({ meta: { hostId: this.host, status: 'playing', createdAt: clock, activeAt: clock }, players });
    return this;
  }
  /** one call as `uid` — the ApiError's status + code + extra come back as data */
  async call(uid, body) {
    const c0 = process.cpuUsage(), w0 = performance.now();
    let out;
    try { out = await holdemAction(uid, { room: this.code, ...body }, clock); } catch (e) {
      if (!(e instanceof ApiError)) throw e;
      out = { error: e.code, status: e.status, message: e.message, ...(e.extra || {}) };
    }
    const c = process.cpuUsage(c0), ms = (c.user + c.system) / 1000;
    this.calls++;
    if (!this.cost) return out;
    COST.calls++; COST.cpu += ms; COST.wall += performance.now() - w0;
    const k = body.holdem;
    (COST.byOp[k] ||= { n: 0, cpu: 0 }).n++; COST.byOp[k].cpu += ms;
    return out;
  }
  async pub() { return fromWire(await val(`rooms/${this.code}/holdem`)); }
  async rec() { const v = await val(`hrec/${this.code}`); return v ? JSON.parse(v.j) : null; }
  async hole(uid) { return val(`hole/${this.code}/${uid}`); }
  brain(id) { return (this.brains[id] ||= rngFrom(`brain:${id}`)); }

  /** THE LEAK SCAN as `who`: the whole room tree + their own private node (all the rules let them read) vs every hidden card */
  async leakScan(who, { forbidden = false } = {}) {
    const rec = await this.rec();
    if (!rec) return;
    const t = rec.m.table;
    const hidden = new Set([...t.deck, ...t.seats.filter(x => x.id !== who && !x.shown).flatMap(x => x.cards)]);
    const mineCards = new Set((t.seats.find(x => x.id === who) || {}).cards || []);
    const room = await phoneRead(who, `rooms/${this.code}`);
    const own = await phoneRead(who, `hole/${this.code}/${who}`);
    // (the public view keeps the last events — an earlier hand's SHOWN cards were legally shown then and are back in this hand's deck:
    //  this hand's events + everything else are scanned against this hand's hidden cards)
    if (room && room.holdem) {
      const pub = fromWire(room.holdem);
      pub.ev = pub.ev.filter(e => e.hand === t.hand);
      room.holdem = pub;
    }
    for (const s of strings(room)) assert.ok(!hidden.has(s), `${who} can read the hidden card ${s} in the room (hand ${t.hand}, ${t.street})`);
    for (const s of strings(own)) assert.ok(!hidden.has(s), `${who}'s own node holds someone else's card ${s}`);
    if (own && own.c) for (const c of own.c) assert.ok(mineCards.has(c), `${who} holds ${c}, not their card`);
    if (forbidden) {
      for (const other of t.seats.map(x => x.id).filter(id => id !== who)) await assertFails(cget(cref(asPhone(who), `hole/${this.code}/${other}`)));
      await assertFails(cget(cref(asPhone(who), `hole/${this.code}`)));
      await assertFails(cget(cref(asPhone(who), 'hole')));
      await assertFails(cget(cref(asPhone(who), `hrec/${this.code}`)));
    }
    this.scans++;
  }

  /** A REFRESH: a phone re-reads everything from scratch (as itself) and must see exactly the server's state */
  async refreshCheck(uid) {
    const rec = await this.rec();
    const pubRaw = await phoneRead(uid, `rooms/${this.code}/holdem`), own = await phoneRead(uid, `hole/${this.code}/${uid}`);
    const pub = fromWire(pubRaw);
    assert.equal(pub.seq, rec.seq, 'the public view is the record\'s latest');
    const { log, ...want } = publicView(rec.m.table);
    assert.deepEqual(pub.table, JSON.parse(JSON.stringify(want)), 'the table a refreshed phone sees = the server\'s');
    const seat = rec.m.table.seats.find(x => x.id === uid);
    if (seat && seat.cards.length) assert.deepEqual(own.c, seat.cards, 'its own two cards');
    else assert.ok(!own || !own.c, 'no cards when not dealt in');
    assert.equal(own && own.pre ? own.pre : undefined, rec.pre[uid] ? rec.pre[uid].kind : undefined, 'its queued pre-action');
  }

  /**
   * ONE STEP of a whole table: the player to act decides on what THEIR phone can read (the public view + their own cards);
   * nobody to act → the clock moves to the server's `due` and the host pokes (the WHO POKES rule). → the public view after.
   */
  async step({ think = 1500, scanAs = null } = {}) {
    const p = await this.pub();
    if (this.cost) {
      const [pv, rv, hv] = await Promise.all([val(`rooms/${this.code}/holdem`), val(`hrec/${this.code}`), val(`hole/${this.code}/${this.uids[0]}`)]);
      COST.pub += JSON.stringify(pv).length; COST.rec += JSON.stringify(rv).length; COST.hole += JSON.stringify(hv || {}).length; COST.n++;
    }
    if (p.ended) {
      if (!p.rep) { await this.call(this.host, { holdem: 'poke' }); }
      return this.pub();
    }
    const L = legalActions(p.table);
    if (L && this.gone.has(L.id)) {                 // nobody taps for a player who left: the clock runs out (the host pokes)
      clock = Math.max(clock, p.due);
      ok(await this.call(this.host, { holdem: 'poke' }));
    } else if (L) {
      const own = await this.hole(L.id);
      const view = { ...p.table, mine: own.c, me: L.id };
      const d = decide(view, L, this.brain(L.id), this.styles[L.id] || 'loose');
      clock += think;
      const r = await this.call(L.id, { holdem: 'act', hand: p.hand, seq: p.seq, action: d.type, ...(d.to != null ? { amount: d.to } : {}) });
      assert.ok(r.ok, `act refused: ${JSON.stringify(r)} for ${JSON.stringify(d)}`);
    } else {
      assert.ok(p.due != null, `a table with nothing due and nobody to act: ${JSON.stringify({ street: p.table.street, ended: p.ended })}`);
      clock = Math.max(clock, p.due);
      const before = p.hand;
      const r = await this.call(this.host, { holdem: 'poke' });
      assert.ok(r.ok, JSON.stringify(r));
      if (r.hand !== before) COST.hands++;
    }
    if (scanAs) await this.leakScan(scanAs, { forbidden: this.calls % 25 === 0 });
    return this.pub();
  }

  async playToEnd({ scanAs, max = 6000, refreshEvery = 37 } = {}) {
    let p = await this.pub(), n = 0;
    while (!(p.ended && p.rep)) {
      assert.ok(++n < max, 'a match that never ends');
      p = await this.step({ scanAs });
      if (n % refreshEvery === 0) await this.refreshCheck(this.uids[n % this.uids.length]);
    }
    return p;
  }
}

const ok = r => { assert.ok(r.ok, JSON.stringify(r)); return r; };
const users = (n, tag) => Array.from({ length: n }, (_, i) => `he-${tag}-${i + 1}`);
async function profiles(uids) { for (const u of uids) await profileAction(u, { action: 'ensure', name: u.replace(/-/g, '').slice(0, 12).toUpperCase(), avatar: 'bolt', color: 'cyan' }, '', clock); }

for (const n of [2, 4, 8]) {
  test(`TURBO at ${n} players through the server, to a winner — the leak scan as a phone every step; the result reported ONCE from the server's record`, async () => {
    const uids = users(n, `t${n}`);
    await profiles(uids);
    const styles = Object.fromEntries(uids.map((u, i) => [u, i % 3 === 0 ? 'jammer' : i % 3 === 1 ? 'loose' : 'maniac']));
    const T = await new Table(uids, { seed: `turbo-${n}`, styles }).seed();
    // only the host starts; a stranger can't touch the table
    assert.equal((await T.call(uids[1], { holdem: 'start', mode: 'tournament', speed: 'turbo' })).error, 'not_host');
    assert.equal((await T.call('he-stranger', { holdem: 'poke' })).error, 'not_in_room');
    const s = ok(await T.call(T.host, { holdem: 'start', mode: 'tournament', speed: 'turbo' }));
    assert.equal(s.hand, 1);
    assert.equal((await T.call(T.host, { holdem: 'start', mode: 'tournament' })).error, 'running', 'one match at a time');
    const B = uids[n - 1];
    await T.leakScan(B, { forbidden: true });
    const p = await T.playToEnd({ scanAs: B });
    assert.ok(p.ended && p.winner && p.rep === 'done');
    assert.equal(p.places.length, n);
    const rec = await T.rec();
    const key = `${T.code}_${rec.id}`;
    const res = await val(`results/${key}`);
    assert.equal(res.st, 'done');
    assert.equal(res.g, 'holdem');
    assert.equal(res.src, 'dealer');
    const pids = await Promise.all(uids.map(u => val(`uids/${u}`)));
    const wins = [];
    for (const pid of pids) {
      const st = await val(`pstats/${pid}`);
      assert.ok(st.m && st.m[key], 'credited, keyed by the match');
      assert.equal(st.g.holdem.p, 1, 'one play');
      if (st.g.holdem.w) wins.push(pid);
    }
    assert.deepEqual(wins, [await val(`uids/${p.winner}`)], 'one win — the winner');
    // more pokes after the end never count it again
    for (const u of uids) await T.call(u, { holdem: 'poke' });
    for (const pid of pids) assert.equal((await val(`pstats/${pid}`)).g.holdem.p, 1);
    console.log(`# holdem TURBO ${n}p: ${rec.m.hands} hands, ${T.calls} calls, ${T.scans} leak scans`);
  });
}

test('CASH: a late joiner, a rebuy, AWAY → SAT OUT → back, a leave, END SESSION mid-hand waits → THE LEDGER sums to 0', async () => {
  const uids = users(3, 'cash');
  const late = 'he-cash-late';
  await profiles([...uids, late]);
  const styles = { [uids[0]]: 'jammer', [uids[1]]: 'jammer', [uids[2]]: 'loose', [late]: 'loose' };
  const T = await new Table(uids, { seed: 'cash', styles }).seed();
  ok(await T.call(T.host, { holdem: 'start', mode: 'cash' }));
  let p = await T.pub();
  assert.equal(p.table.seats.length, 3);
  assert.equal((await T.call(late, { holdem: 'sit' })).error, 'not_in_room', 'only someone in the room sits down');
  await ref(`rooms/${T.code}/players/${late}`).set({ name: 'LATE', color: 'cyan', avatar: 'bolt', joinedAt: 9 });   // a late joiner enters the room
  // the late joiner sits down mid-hand → dealt in from the next hand
  ok(await T.call(late, { holdem: 'sit' }));
  p = await T.pub();
  assert.equal(p.table.seats.find(x => x.id === late).status, 'sitout');
  // play until someone is at zero → they rebuy
  let busted = null;
  for (let i = 0; i < 3000 && !busted; i++) {
    p = await T.step({ scanAs: late });
    if (p.table.street === 'done') busted = p.table.seats.find(x => x.stack === 0);
  }
  assert.ok(busted, 'someone went broke');
  assert.equal((await T.call(uids.find(u => u !== busted.id), { holdem: 'rebuy' })).error, 'illegal', 'a rebuy only at zero');
  ok(await T.call(busted.id, { holdem: 'rebuy' }));
  // AWAY: one player stops tapping — the clock (pokes) times them out twice → SAT OUT (not dealt in, no blinds)
  const sleeper = uids[2];
  for (let i = 0; i < 400; i++) {
    p = await T.pub();
    if (p.table.seats.find(x => x.id === sleeper).status === 'sitout' && p.table.street !== 'done') break;
    const L = legalActions(p.table);
    if (L && L.id === sleeper) { clock = Math.max(clock, p.table.deadline); ok(await T.call(late, { holdem: 'poke' })); continue; }
    await T.step();
  }
  p = await T.pub();
  const sl = p.table.seats.find(x => x.id === sleeper);
  assert.ok(sl.away && sl.status === 'sitout', 'SAT OUT');
  assert.ok(!(await T.hole(sleeper) || {}).c, 'no cards while sat out');
  assert.ok(!p.ev.some(e => e.t === 'posted' && e.id === sleeper && e.hand === p.hand), 'no blinds while sat out');
  ok(await T.call(sleeper, { holdem: 'back' }));
  // a leave (a player mid-session): their stack counts at the moment they leave
  for (let i = 0; i < 200 && (await T.pub()).table.street !== 'done'; i++) await T.step();
  const leaver = late;
  ok(await T.call(leaver, { holdem: 'leave' }));
  // END SESSION mid-hand: waits for the hand; only the host
  for (let i = 0; i < 50; i++) { p = await T.pub(); if (p.table.street === 'preflop' && legalActions(p.table)) break; await T.step(); }
  assert.equal((await T.call(uids[1], { holdem: 'endSession' })).error, 'not_host');
  clock += 5 * 60_000;                               // (HE10 — A7: a CASH session counts from 10 hands + 5 minutes — this one has the hands)
  ok(await T.call(T.host, { holdem: 'endSession' }));
  p = await T.pub();
  assert.ok(p.ending && !p.ended, 'mid-hand: the session ends with the hand');
  assert.equal((await T.call(T.host, { holdem: 'endSession', voidHand: true })).error, 'ending', 'HE10 (A17): no void path — a second END SESSION just waits');
  p = await T.playToEnd({ scanAs: uids[1] });
  assert.ok(p.ended && p.ledger);
  assert.equal(p.ledger.reduce((a, r) => a + r.net, 0), 0, 'THE LEDGER sums to 0');
  assert.ok(p.ledger.find(r => r.id === busted.id).rebuys >= 1);
  assert.ok(p.players[leaver].left);
  const rec = await T.rec();
  assert.ok(rec.m.hands >= 10, `${rec.m.hands} hands`);
  assert.equal(p.rep, 'done');
  assert.equal((await val(`results/${T.code}_${rec.id}`)).st, 'done', 'the session reported once from the server\'s record');
});

test('HE10 — A15 + A7 + A16 on the emulators: a seat whose player left the room goes AWAY at once; a seconds-long CASH session ends but credits NOTHING (rep short); the record + the private nodes go after the end', async () => {
  const uids = users(3, 'h10');
  await profiles(uids);
  const T = await new Table(uids, { seed: 'h10' }).seed();
  ok(await T.call(T.host, { holdem: 'start', mode: 'cash' }));
  let p = await T.pub();
  // A15: the player to act leaves the room → the next call (anyone's) puts them AWAY + checks / folds for them at once
  const L = legalActions(p.table);
  await ref(`rooms/${T.code}/players/${L.id}`).remove();
  T.gone.add(L.id);
  const other = uids.find(u => u !== L.id && u !== T.host) || T.host;
  ok(await T.call(other, { holdem: 'pre', hand: p.hand, pre: null }));
  p = await T.pub();
  assert.ok(p.table.seats.find(x => x.id === L.id).away, 'AWAY at once');
  assert.notEqual(legalActions(p.table)?.id, L.id, 'no longer the one to act');
  // END SESSION after seconds of play → over, nothing credited
  ok(await T.call(T.host, { holdem: 'endSession' }));
  for (let i = 0; i < 60 && !((p = await T.pub()).ended && p.rep); i++) await T.step();
  assert.equal(p.rep, 'short', 'too short to count');
  const rec = await T.rec();
  assert.equal(await val(`results/${T.code}_${rec.id}`), null, 'no result');
  for (const u of uids) { const pid = await val(`uids/${u}`); const st = pid ? await val(`pstats/${pid}`) : null; assert.ok(!(st && st.g && st.g.holdem), 'no play credited'); }
  // A16: the clean-up moment — the host's poke deletes the record + every private node; the table says nothing is due (the phones stop)
  assert.equal(p.due, rec.m.endAt + 8000);
  clock = Math.max(clock, p.due);
  ok(await T.call(T.host, { holdem: 'poke' }));
  assert.equal(await val(`hrec/${T.code}`), null, 'the record is gone');
  assert.equal(await val(`hole/${T.code}`), null, 'the private nodes are gone');
  const after = await T.pub();
  assert.equal(after.due, null);
  assert.ok(after.ended, 'the table itself stays (the podium reads it)');
  ok(await T.call(T.host, { holdem: 'start', mode: 'tournament', speed: 'turbo' }), 'a new start still works');
});

test('HE10 — A16: a record left by an EARLIER room with the same word is never advanced — a poke from the new room deletes it', async () => {
  const uids = users(2, 'old');
  const T = await new Table(uids, { seed: 'old' }).seed();
  ok(await T.call(T.host, { holdem: 'start', mode: 'tournament', speed: 'turbo' }));
  // the room closes; a new room takes the word a day later (a new createdAt, no table yet)
  clock += 86_400_000;
  await ref(`rooms/${T.code}/meta/createdAt`).set(clock);
  await ref(`rooms/${T.code}/holdem`).remove();
  const r = await T.call(T.host, { holdem: 'poke' });
  assert.equal(r.error, 'no_match');
  assert.equal(await val(`hrec/${T.code}`), null);
  assert.equal(await val(`hole/${T.code}`), null);
  assert.equal(await val(`rooms/${T.code}/holdem`), null, 'nothing published into the new room');
});

test('A MULTI-WAY ALL-IN: the run-out street by street on pokes — nothing early, upcoming cards nowhere a phone can read', async () => {
  const uids = users(4, 'ro');
  const T = await new Table(uids, { seed: 'runout' }).seed();
  ok(await T.call(T.host, { holdem: 'start', mode: 'tournament', speed: 'turbo' }));
  let p = await T.pub();
  while (!p.table.runout) {
    const L = legalActions(p.table);
    assert.ok(L, 'betting still open');
    clock += 500;
    ok(await T.call(L.id, { holdem: 'act', hand: p.hand, seq: p.seq, action: L.canRaise ? 'allin' : 'call' }));
    p = await T.pub();
  }
  assert.equal(p.table.board.length, 0);
  assert.ok(p.ev.some(e => e.t === 'runout'));
  assert.ok(p.table.seats.filter(x => x.held).every(x => x.cards && x.cards.length === 2), 'the all-in hands face up');
  for (const who of uids) await T.leakScan(who, { forbidden: who === uids[0] });
  for (const want of [3, 4]) {
    clock = p.due - 1;
    const early = ok(await T.call(uids[1], { holdem: 'poke' }));
    assert.equal(early.changed, false, 'a poke before the reveal changes nothing');
    assert.equal((await T.pub()).table.board.length, want - (want === 3 ? 3 : 1));
    clock = p.due;
    ok(await T.call(T.host, { holdem: 'poke' }));
    p = await T.pub();
    assert.equal(p.table.board.length, want, `street ${want}`);
    for (const who of uids) await T.leakScan(who);
  }
  clock = p.due;
  ok(await T.call(T.host, { holdem: 'poke' }));
  p = await T.pub();
  assert.equal(p.table.board.length, 5);
  assert.equal(p.table.street, 'done');
  assert.ok(p.ev.some(e => e.t === 'pot'));
});

test('PRE-ACTIONS fire on the server while the phone sends nothing; THE CLOCK runs into the time bank, then folds', async () => {
  const uids = users(4, 'pre');
  const T = await new Table(uids, { seed: 'pre' }).seed();
  ok(await T.call(T.host, { holdem: 'start', mode: 'tournament', speed: 'standard' }));
  let p = await T.pub();
  const order = [];
  let L = legalActions(p.table);
  // the seat after the first to act queues CALL ANY; the next one CHECK/FOLD — then their phones go quiet
  const seats = p.table.seats.filter(x => x.status === 'in').sort((a, b) => a.seat - b.seat);
  const i0 = seats.findIndex(x => x.id === L.id);
  const caller = seats[(i0 + 1) % seats.length].id, folder = seats[(i0 + 2) % seats.length].id;
  ok(await T.call(caller, { holdem: 'pre', hand: p.hand, pre: 'callany' }));
  ok(await T.call(folder, { holdem: 'pre', hand: p.hand, pre: 'checkfold' }));
  assert.equal((await T.hole(caller)).pre, 'callany', 'the toggle on the phone\'s own node');
  assert.equal((await T.pub()).seq, p.seq, 'a toggle is private: the public view did not move');
  assert.equal((await T.call(caller, { holdem: 'pre', hand: p.hand, pre: 'foldall' })).error, 'bad_pre');
  clock += 1000;
  ok(await T.call(L.id, { holdem: 'act', hand: p.hand, seq: p.seq, action: 'raise', amount: 100 }));
  p = await T.pub();
  assert.ok(p.ev.some(e => (e.t === 'called' || e.t === 'allin') && e.id === caller), 'CALL ANY called the raise — no call from that phone');
  assert.ok(p.ev.some(e => e.t === 'folded' && e.id === folder), 'CHECK/FOLD folded to the raise');
  order.push(caller, folder);
  // THE CLOCK: the player to act now sends nothing
  L = legalActions(p.table);
  const sleeper = L.id, deadline = p.table.deadline;
  assert.equal(p.due, deadline);
  clock = deadline - 1;
  assert.equal(ok(await T.call(T.host, { holdem: 'poke' })).changed, false, 'not due yet');
  clock = deadline;
  ok(await T.call(T.host, { holdem: 'poke' }));
  p = await T.pub();
  assert.ok(p.ev.some(e => e.t === 'timebank' && e.id === sleeper), 'into the time bank');
  assert.equal(p.table.deadline, deadline + BANK_MS);
  clock = deadline + BANK_MS;
  ok(await T.call(uids.find(u => u !== T.host), { holdem: 'poke' }));
  p = await T.pub();
  assert.ok(p.ev.some(e => e.t === 'timeout' && e.id === sleeper && e.action === 'fold'), 'then the fold');
  assert.equal(SHOT_MS, 20_000);
});

test('DOUBLE TAPS + STALE SEQ are refused harmlessly (409 + the current seq, nothing written); a refresh mid-hand sees the exact state', async () => {
  const uids = users(3, 'dbl');
  const T = await new Table(uids, { seed: 'dbl' }).seed();
  ok(await T.call(T.host, { holdem: 'start', mode: 'tournament' }));
  let p = await T.pub();
  const L = legalActions(p.table);
  const body = { holdem: 'act', hand: p.hand, seq: p.seq, action: 'call' };
  const [a, b] = await Promise.all([T.call(L.id, body), T.call(L.id, body)]);
  const oks = [a, b].filter(r => r.ok), bad = [a, b].filter(r => !r.ok);
  assert.equal(oks.length, 1, 'one of a double tap lands');
  assert.equal(bad[0].status, 409);
  assert.equal(bad[0].error, 'stale');
  const after = await T.pub();
  assert.equal(after.seq, p.seq + 1, 'one change');
  assert.equal(bad[0].seq, after.seq);
  const rec0 = await val(`hrec/${T.code}/j`);
  assert.equal((await T.call(L.id, body)).error, 'stale');
  assert.equal((await T.call(uids.find(u => u !== legalActions(after.table).id), { holdem: 'act', hand: after.hand, seq: after.seq, action: 'fold' })).error, 'illegal', 'not your turn');
  assert.equal((await T.call(L.id, { ...body, hand: 99, seq: after.seq })).error, 'stale');
  assert.equal(await val(`hrec/${T.code}/j`), rec0, 'refusals wrote nothing');
  for (const u of uids) await T.refreshCheck(u);
  // mid-hand after more actions + a queued pre-action: every phone's refresh still exact
  p = await T.step();
  const L2 = legalActions(p.table);
  const other = p.table.seats.find(x => x.status === 'in' && x.id !== L2.id).id;
  ok(await T.call(other, { holdem: 'pre', hand: p.hand, pre: 'checkfold' }));
  for (const u of uids) await T.refreshCheck(u);
});

test('THE HOST LEAVES mid-match: play goes on (the server runs it); END SESSION moves to the new host', async () => {
  const uids = users(4, 'mig');
  const T = await new Table(uids, { seed: 'mig', styles: Object.fromEntries(uids.map(u => [u, 'loose'])) }).seed();
  ok(await T.call(T.host, { holdem: 'start', mode: 'cash' }));
  for (let i = 0; i < 25; i++) await T.step();
  const old = T.host, next = uids[1];
  await ref(`rooms/${T.code}/players/${old}`).remove();
  await ref(`rooms/${T.code}/meta/hostId`).set(next);
  T.host = next;
  T.gone.add(old);
  assert.equal((await T.call(old, { holdem: 'poke' })).error, 'not_in_room', 'the old host is gone from the room');
  const h0 = (await T.pub()).hand;
  for (let i = 0; i < 120; i++) await T.step();
  assert.ok((await T.pub()).hand > h0, 'hands keep coming — the old host\'s seat folds to the clock');
  assert.equal((await T.call(uids[2], { holdem: 'endSession' })).error, 'not_host');
  ok(await T.call(next, { holdem: 'endSession' }));
  const p = await T.playToEnd();
  assert.ok(p.ended);
  assert.equal(p.ledger.reduce((a, r) => a + r.net, 0), 0);
});

test('MANY PHONES POKE AT ONCE: a due event is applied ONCE', async () => {
  const uids = users(8, 'herd');
  const T = await new Table(uids, { seed: 'herd' }).seed();
  T.cost = false;                                 // (a pile-up on purpose — out of the cost line)
  ok(await T.call(T.host, { holdem: 'start', mode: 'tournament' }));
  let p = await T.pub();
  const who = legalActions(p.table).id;
  clock = p.table.deadline;
  const rs = await Promise.all(uids.map(u => T.call(u, { holdem: 'poke' })));
  assert.ok(rs.every(r => r.ok), JSON.stringify(rs.filter(r => !r.ok)));
  assert.equal(rs.filter(r => r.changed).length, 1, 'one poke applied it');
  p = await T.pub();
  assert.equal(p.ev.filter(e => e.t === 'timebank' && e.id === who).length, 1, 'one time bank');
  clock = p.table.deadline;
  await Promise.all(uids.map(u => T.call(u, { holdem: 'poke' })));
  p = await T.pub();
  assert.equal(p.ev.filter(e => e.t === 'timeout' && e.id === who).length, 1, 'one timeout');
  // the pause before the next hand: many pokes at the moment → one deal
  while (p.table.street !== 'done') { p = await T.step(); }
  clock = p.due;
  const hand = p.hand;
  await Promise.all(uids.map(u => T.call(u, { holdem: 'poke' })));
  p = await T.pub();
  assert.equal(p.hand, hand + 1, 'one new hand');
  assert.equal(p.ev.filter(e => e.t === 'dealt' && e.hand === hand + 1).length, 1);
});

test('HE3 — THE LEAN WIRE on the emulators: the console\'s start (its matchId, its players, the walk inside), the room kept ACTIVE, a stale publish HEALED, a console restart', async () => {
  const uids = users(4, 'wire');
  const T = await new Table(uids, { seed: 'wire' }).seed();
  T.cost = false;
  await ref(`rooms/${T.code}/meta/activeAt`).set(clock - 50 * 60_000);
  // the console's start: its matchId, only its connected players (the 4th is offline), the first deal after the walk inside
  const s = ok(await T.call(T.host, { holdem: 'start', mode: 'tournament', matchId: 'abc123', uids: uids.slice(0, 3), at: clock + 5000 }));
  assert.equal(s.id, 'abc123');
  let p = await T.pub();
  assert.equal(p.hand, 0, 'nothing dealt during the walk inside');
  assert.equal(p.table.seats.length, 3, 'only the players the console named');
  assert.equal(p.due, clock + 5000);
  assert.ok((await val(`rooms/${T.code}/meta/activeAt`)) >= clock, 'the dealer stamped the room active');
  clock += 5000;
  ok(await T.call(uids[1], { holdem: 'poke' }));
  p = await T.pub();
  assert.equal(p.hand, 1, 'the first deal on the poke when the match begins');
  // THE HEAL: an out-of-order publish leaves the view behind (an old seq + a wrong part) → the next poke rewrites it whole
  await ref(`rooms/${T.code}/holdem`).update({ seq: p.seq - 1, 't/turn': '7' });
  const r = ok(await T.call(uids[2], { holdem: 'poke' }));
  assert.equal(r.changed, false);
  await T.refreshCheck(uids[0]);
  // a second start while it runs: refused — unless the CONSOLE stamped a new start (meta/go) and its game is no longer this match
  assert.equal((await T.call(T.host, { holdem: 'start', mode: 'cash', matchId: 'zzz999' })).error, 'running');
  await ref(`rooms/${T.code}/meta/go`).set({ m: 'zzz999', g: 'holdem', at: clock });
  ok(await T.call(T.host, { holdem: 'start', mode: 'cash', matchId: 'zzz999' }));
  p = await T.pub();
  assert.equal(p.id, 'zzz999');
  assert.equal(p.mode, 'cash');
  assert.equal(p.table.seats.length, 4);
});

test("HE8 — THE OWNER'S LIVE TEST: while HOLD'EM is playable: false only a room HOSTED BY THE OWNER starts it (ADMIN_PIDS — the server's own check); a normal host is refused, a guest can't start it; guests at the owner's table play normally", async () => {
  const row = GAMES.find(g => g.id === 'holdem');
  assert.equal(row.playable, false, "HOLD'EM ships playable: false");
  await ref('testHoldemGate').set(true);   // (the live site's rule on the emulators — without it a local table stays open for the E2E)
  try {
    // a NORMAL host (a real profile, not the owner): refused, nothing written
    const plain = users(3, 'gate');
    await profiles(plain);
    const A = await new Table(plain, { seed: 'gate' }).seed();
    A.cost = false;
    const r = await A.call(A.host, { holdem: 'start', mode: 'tournament', speed: 'turbo' });
    assert.equal(r.status, 403); assert.equal(r.error, 'not_open');
    assert.equal(await val(`hrec/${A.code}`), null, 'no record');
    assert.equal(await val(`rooms/${A.code}/holdem`), null, 'no table');
    // a guest (not the host) still gets not_host first
    assert.equal((await A.call(plain[1], { holdem: 'start', mode: 'tournament' })).error, 'not_host');
    // a host with NO profile: refused too
    const anon = users(2, 'gate-anon');
    const N = await new Table(anon, { seed: 'gate-anon' }).seed();
    N.cost = false;
    assert.equal((await N.call(N.host, { holdem: 'start', mode: 'cash' })).error, 'not_open');

    // THE OWNER hosts: his profile id in ADMIN_PIDS (the production path) → the match starts; a GUEST at his table acts normally
    const own = users(3, 'owner');
    await profiles(own);
    const ownerPid = await val(`uids/${own[0]}`);
    assert.ok(ownerPid, 'the owner has a profile');
    assert.equal(await startOpen(own[0]), false, 'not the owner until ADMIN_PIDS names him');
    process.env.ADMIN_PIDS = `someoneelse1,${ownerPid}`;
    try {
      assert.equal(await startOpen(own[0]), true);
      assert.equal(await startOpen(own[1]), false, 'his guest is not the owner');
      const O = await new Table(own, { seed: 'owner' }).seed();
      O.cost = false;
      assert.equal((await O.call(own[1], { holdem: 'start', mode: 'tournament' })).error, 'not_host', "a guest in his room can't start it");
      ok(await O.call(O.host, { holdem: 'start', mode: 'tournament', speed: 'turbo' }));
      let p = await O.pub();
      assert.equal(p.hand, 1);
      for (let i = 0; i < 12; i++) p = await O.step({ scanAs: own[2] });
      assert.ok(O.calls > 12, "the guests act at the owner's table");
    } finally { process.env.ADMIN_PIDS = ''; }

    // the emulator-only owner (testAdmins/{pid} — the E2E's, as the radio's roleOf) counts too
    const ta = users(2, 'tadmin');
    await profiles(ta);
    await ref(`testAdmins/${await val(`uids/${ta[0]}`)}`).set(true);
    const TA = await new Table(ta, { seed: 'tadmin' }).seed();
    TA.cost = false;
    ok(await TA.call(TA.host, { holdem: 'start', mode: 'cash' }));

    // playable: true (Ben's switch) opens it to EVERY host
    row.playable = true;
    try { assert.equal(await startOpen(plain[0]), true); assert.equal(await startOpen(anon[0]), true); } finally { row.playable = false; }
  } finally { await ref('testHoldemGate').remove(); await ref('testAdmins').remove(); }
  // without the test switch a local table stays open (the E2E's preview rooms)
  assert.equal(await startOpen(users(1, 'open')[0]), true);
});

test('A KICKED player: refused at the table, their private node closed, and (CASH) their seat leaves on the next poke', async () => {
  const uids = users(4, 'kick');
  const T = await new Table(uids, { seed: 'kick' }).seed();
  ok(await T.call(T.host, { holdem: 'start', mode: 'cash' }));
  const k = uids[3];
  await T.leakScan(k);
  await ref(`rooms/${T.code}/kicked/${k}`).set(true);
  assert.equal((await T.call(k, { holdem: 'poke' })).error, 'not_in_room');
  assert.equal((await T.call(k, { holdem: 'act', hand: 1, seq: 1, action: 'fold' })).error, 'kicked');
  await assertFails(cget(cref(asPhone(k), `hole/${T.code}/${k}`)));
  clock += 1000;
  await T.call(T.host, { holdem: 'poke' });
  for (let i = 0; i < 60 && !(await T.pub()).players[k].left; i++) await T.step();
  assert.ok((await T.pub()).players[k].left, 'their seat left the table');
});

test('THE CALL BUDGET: a flood from one uid gets cheap 429s', async () => {
  const uids = users(2, 'flood');
  const T = await new Table(uids, { seed: 'flood' }).seed();
  T.cost = false;
  forgetHoldemBudgets();
  await ref('rl').remove();
  ok(await T.call(T.host, { holdem: 'start', mode: 'tournament' }));
  let n429 = 0;
  for (let i = 0; i < CALLS.max + 5; i++) { const r = await T.call(uids[1], { holdem: 'poke' }); if (r.status === 429) n429++; }
  assert.ok(n429 >= 5, `${n429} refused`);
  assert.ok((await T.call(T.host, { holdem: 'poke' })).ok, 'another uid is untouched');
  forgetHoldemBudgets();
});

// ---- the HTTP layer: the real handler (POST /api/report { holdem }) with real ID tokens from the auth emulator
async function signUp() {
  const r = await fetch(`http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo-key`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{"returnSecureToken":true}' });
  return r.json();
}
function http(handler, { token, body }) {
  return new Promise(resolve => {
    const req = { method: 'POST', url: '/api/report', headers: token ? { authorization: `Bearer ${token}` } : {}, body };
    const headers = {};
    const res = { statusCode: 200, setHeader: (k, v) => { headers[k.toLowerCase()] = v; }, end: t => resolve({ status: res.statusCode, headers, body: JSON.parse(t) }) };
    handler(req, res);
  });
}

test('HTTP: /api/report carries the dealer — a token required, real statuses, Server-Timing on every answer', async () => {
  const [a, b] = [await signUp(), await signUp()];
  const T = new Table([a.localId, b.localId], { seed: 'http' });
  await T.seed();
  assert.equal((await http(reportHandler, { body: { holdem: 'poke', room: T.code } })).status, 401);
  const s = await http(reportHandler, { token: a.idToken, body: { holdem: 'start', room: T.code, mode: 'tournament', speed: 'turbo' } });
  assert.equal(s.status, 200, JSON.stringify(s.body));
  assert.match(s.headers['server-timing'], /auth;dur=.*tx;dur=[\d.]+;desc="1".*total;dur=/);
  const p = await T.pub();
  const L = legalActions(p.table);
  const tok = L.id === a.localId ? a.idToken : b.idToken;
  const stale = await http(reportHandler, { token: tok, body: { holdem: 'act', room: T.code, hand: p.hand, seq: p.seq - 1, action: 'call' } });
  assert.equal(stale.status, 409);
  assert.equal(stale.body.error, 'stale');
  assert.equal(stale.body.seq, p.seq);
  assert.match(stale.headers['server-timing'], /total;dur=/);
  const quiet = await http(reportHandler, { token: a.idToken, body: { holdem: 'poke', room: T.code } });
  assert.equal(quiet.status, 200);
  assert.equal(quiet.body.changed, false);
  assert.ok(!/tx;dur/.test(quiet.headers['server-timing']), 'a poke with nothing due never opens a transaction');
  assert.equal((await http(reportHandler, { token: a.idToken, body: { holdem: 'nope', room: T.code } })).status, 400);
  // the classic report path is untouched
  const r = await http(reportHandler, { token: a.idToken, body: { code: 'ZZZZ', matchId: 'abc123' } });
  assert.equal(r.status, 200);
  assert.equal(r.body.ok, false);
  void PAUSE;
});
