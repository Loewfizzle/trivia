// HIGH RISE's DAILY on the server (HIGH RISE DAILY A — docs/highrise.md "THE DAILY"; the owner's decisions: docs/games/plan.md "THE HIGH RISE
// DAILY"): the cartridge (HIGHRISE_DAILY — registered in dailies.js#SERVER_CARTS; its config.js#DAILIES row ships `on: false`) + THE HELD
// RUN's database half (the pure half: js/games/highrise/held.js — the phone runs the same file). ONE SHOT a day; the run is cut into LEGS:
//   start   → a fresh run (leg 0 — its GO = now + the 3 · 2 · 1) · or a RESUME (a hold used: the open leg CLOSED first — its `e`, so no chunk
//             lands after it — then its chunks read, the slab's entry T picked from the log the SERVER has, a new leg opened at T) · or the run
//             ENDED when it can't come back (no hold left · the run over in the replay · a past day's held run · a refused log)
//   (the chunks: the phone appends them to its leg's proof node — server-stamped, the rules check them: database.rules.json dly/highrise)
//   finish  → the run ENDED (its leg closed) → THE JUDGE replays every leg (taps + holds) → the score (floors → perfects → the earlier tick)
//   pause   → THE ROOM WINS: a FREE hold owed (the room really started a game — api/daily.js checks it); the next start opens it
//   settle  → `today` / THE DAY'S CLOSE: a run that can't come back is ENDED at its last server tap and scored (the phone's own end that
//             never reached FINISH · no hold left and quiet · a past day's run not in play · THE DAY'S CLOSE: whatever its state)
// THE RECORD (server-only — the rules' default deny) dly/highrise/{day}/p/{pid} = { st, l: { [i]: { u, go, z, t, r? } }, room?: 1 (a free
//   hold owed), e?: the end (server time), o?: why it ended ('fin' · 'holds' · 'over' · 'gone' · 'close' · 'bad'), f/p/k/w/h/rh/cut/bad
//   (the judge's answer, written at the finish) }
import { ref, val } from './fb.js';
import { dailySeed } from './dailies.js';   // (a cycle — dailies.js lists this cartridge; the seed is only read inside a call)
import { streakDay } from '../../js/core/streak.js';
import { bestView } from '../../js/core/daily-best.js';
import { LEAD_MS, QUIET_MS, PROOF_DAYS, HOLDS, ROOM_HOLDS, legsOf, legEnd, logOf, nextHoldTick, nextHoldKind, holdsOf, holdsLeft, judgeHeld, shareOf, hrFloors, floorsAfter, roomFree, roomKey } from '../../js/games/highrise/held.js';

export const GAME = 'highrise';
const SEEDS = new Map();
/** THE DAY: its seed (an HMAC of THE DAILY SECRET — the same for everyone, memoised per warm function; practice never uses it) */
export async function hrDay(day) {
  if (!SEEDS.has(day)) {
    const p = dailySeed(GAME, day).then(seed => ({ seed: `h${seed}` }), e => { SEEDS.delete(day); throw e; });
    SEEDS.set(day, p);
    for (const k of [...SEEDS.keys()].slice(0, -4)) SEEDS.delete(k);
  }
  return SEEDS.get(day);
}
export const forgetHrDays = () => SEEDS.clear();

const base = day => `dly/${GAME}/${day}`;
/** a leg's proof node (the phone writes here — the uid that opened the leg, its index) */
export const proofPath = (day, uid, i) => `${base(day)}/w/${uid}/${i}`;
/** every leg's node, in the record's order → { [i]: node } */
async function nodesOf(day, rec) {
  const legs = legsOf(rec), got = await Promise.all(legs.map(L => val(proofPath(day, L.u, L.i))));
  return Object.fromEntries(legs.map((L, k) => [L.i, got[k]]));
}
const lastLeg = rec => { const L = legsOf(rec); return L.length ? L[L.length - 1] : null; };
/** is the open leg possibly in play at `now`? (no `e` on its node, a chunk / its GO within QUIET_MS — a playing phone sends every tap at once) */
export function legLive(L, node, now) {
  if (!L || (node && Number.isFinite(node.e))) return false;
  const last = Math.max(L.go, ...Object.values((node && node.c) || {}).map(c => (c && Number.isFinite(c.at) ? c.at : 0)));
  return now - last < QUIET_MS;
}
/** CLOSE the open leg's node (its `e` = now, once): from here the rules take no chunk on it — what the server reads is final. `x` = the SERVER
 *  closed it (a hold, the server's end) — written FIRST: `settle` never takes a hold's close for the phone's own FIN (the race the E2E found:
 *  the app's `today` on the return, beside the resume's START) */
async function closeLeg(day, rec, now, why = 'hold') {
  const L = lastLeg(rec);
  if (!L) return;
  const path = proofPath(day, L.u, L.i);
  // (THE FRESH-EYES REVIEW: `x` + `e` in ONE transaction, only while the leg is still open — a leg the PHONE closed (its own end: `e`, no `x`)
  //  keeps saying so; `x` before was written over it, and a START could then revive a run the fuse had ended)
  await ref(path).transaction(cur => (cur && cur.e != null ? undefined : { ...(cur || {}), x: why, e: now })).catch(e => console.warn('hr close leg', e && e.message));
}

/** END the run (its open leg closed, the record's `e` + why) — once; → true = ended now or before */
export async function endRun({ pid, day, now, why = 'fin' }) {
  const rec = await val(`${base(day)}/p/${pid}`);
  if (!rec) return false;
  if (rec.e) return true;
  await closeLeg(day, rec, now, 'end');
  const tx = await ref(`${base(day)}/p/${pid}`).transaction(cur => (cur == null ? null : cur.e ? undefined : { ...cur, e: now, o: why }));
  const v = tx.snapshot.val();
  return !!(v && v.e);
}

/**
 * THE FIX PASS — S5: A LEG'S NODE IS ITS PROFILE'S. The node is keyed by the DEVICE's uid (dly/highrise/{day}/w/{uid}/{leg}) and START
 * opened it with a plain set — a SECOND PROFILE on the same phone (a restore key) replaced the first one's open leg, chunks and all, and the
 * first profile's next START read an empty log: ONE SHOT replayed from floor 0. Now the node names its profile (`p`, server-written) and a
 * START that finds ANOTHER profile's node at its path ENDS that profile's run and JUDGES it from the node as it stands (its score kept on its
 * record) BEFORE taking the node; the judge refuses a node whose GO is not its leg's (held.js#logOf — never another profile's taps).
 */
async function takeNode(day, uid, i, pid, now, seed) {
  const n = await val(proofPath(day, uid, i)).catch(() => null);
  if (!n || !n.p || n.p === pid) return;
  const other = String(n.p);
  try {
    await endRun({ pid: other, day, now, why: 'close' });   // (an end word the run's card already knows)
    const rec = await val(`${base(day)}/p/${other}`);
    if (rec) await judged({ record: rec, data: { seed }, day, pid: other });
  } catch (e) { console.warn('hr take node', e && e.message); }
}

/** what the phone gets for a leg: the seed, the leg (its GO, its tick T, its path), the log so far (play ticks), the holds left */
const runOf = ({ seed, day, uid, i, go, z, t, events, rec, room }) => ({ seed, leg: i, go, z, t, path: proofPath(day, uid, i), ev: events, holds: holdsOf(rec).h, left: holdsLeft(rec), ...(i > 0 ? { held: 1 } : {}), ...(room ? { room: 1 } : {}) });

/**
 * START (api/daily.js `start` for a `held` cartridge): a fresh run · a RESUME (a hold) · the run ENDED. A past day's run (A RUN KEEPS ITS OWN
 * DAY) resumes only while it is still in play (a refresh across 4 am) — a held run's day closed at its 4 am.
 * → { run } | { ended: why } | { refused: 'busy' } (two starts at once — the phone asks again)
 */
export async function startHeld({ pid, uid, day, now, startedAt, today = streakDay(now) }) {
  const recRef = ref(`${base(day)}/p/${pid}`);
  const [rec, { seed }] = await Promise.all([val(`${base(day)}/p/${pid}`), hrDay(day)]);
  if (!rec) {
    const go = now + LEAD_MS, z = legEnd(go, 0);
    const tx = await recRef.transaction(cur => (cur == null ? { st: startedAt || now, l: { 0: { u: String(uid), go, z, t: 0 } } } : undefined));
    if (!tx.committed) return { refused: 'busy' };
    await takeNode(day, uid, 0, pid, now, seed);
    await ref(proofPath(day, uid, 0)).set({ go, z, p: pid });
    const made = tx.snapshot.val();
    return { run: runOf({ seed, day, uid, i: 0, go, z, t: 0, events: [], rec: made }) };
  }
  if (rec.e) return { ended: rec.o || 'fin' };
  const legs = legsOf(rec), L = legs[legs.length - 1];
  if (!L) { await endRun({ pid, day, now, why: 'bad' }); return { ended: 'bad' }; }
  // (a past day: only a run still IN PLAY crosses 4 am — read before the leg is closed)
  const node = await val(proofPath(day, L.u, L.i));
  // (THE FRESH-EYES REVIEW: the open leg already closed BY THE PHONE (its own end — the fuse, a miss, the 200th floor: `e`, no `x`) whose FINISH
  //  never came = the run ENDED there — never a hold: a blocked FINISH can't revive a run the fuse ended)
  if (node && Number.isFinite(node.e) && !node.x) { await endRun({ pid, day, now, why: 'fin' }); return { ended: 'fin' }; }
  if (day !== today && !legLive(L, node, now)) { await endRun({ pid, day, now, why: 'close' }); return { ended: 'close' }; }
  // THE UNDO GUARD: the open leg closed FIRST — then what the server has is final; a tap the server never got is gone with the hold
  await closeLeg(day, rec, now);
  const nodes = await nodesOf(day, rec), log = logOf(rec, nodes);
  if (log.why || log.cut) { await endRun({ pid, day, now, why: 'bad' }); return { ended: 'bad' }; }
  const kind = nextHoldKind(rec), T = nextHoldTick(seed, log.events);
  if (T == null || !kind) { const why = T == null ? 'over' : 'holds'; await endRun({ pid, day, now, why }); return { ended: why }; }
  const i = legs.length, go = now + LEAD_MS, z = legEnd(go, T);
  let made = null;
  const tx = await recRef.transaction(cur => {
    // (a cold cache's first attempt sees null: never abort on it — null writes nothing new, and the database retries with the real record)
    if (cur == null) return null;
    if (cur.e || legsOf(cur).length !== i) return undefined;
    const { room, ...keep } = cur;
    made = { ...keep, l: { ...(cur.l || {}), [i]: { u: String(uid), go, z, t: T, ...(kind === 'room' ? { r: 1 } : {}) } } };
    void room;
    return made;
  });
  if (!tx.committed) return { refused: 'busy' };
  await takeNode(day, uid, i, pid, now, seed);
  await ref(proofPath(day, uid, i)).set({ go, z, p: pid });
  return { run: runOf({ seed, day, uid, i, go, z, t: T, events: log.events, rec: made, room: kind === 'room' }) };
}

/** `today` / THE DAY'S CLOSE: END a run that can't come back (→ true; the caller scores it) — null = it may still (RESUME on the ticket) */
export async function settleHeld({ pid, day, now, force = false, today = streakDay(now) }) {
  const rec = await val(`${base(day)}/p/${pid}`);
  if (!rec) return null;
  if (rec.e) return true;
  if (force) return endRun({ pid, day, now, why: 'close' });
  const L = lastLeg(rec), node = L ? await val(proofPath(day, L.u, L.i)) : null;
  const live = legLive(L, node, now);
  // (the phone's own end that never reached FINISH: its leg's `e` — never one the SERVER wrote (`x`: a hold's close, mid-resume)
  if (node && Number.isFinite(node.e) && !node.x) return endRun({ pid, day, now, why: 'fin' });
  if (day !== today) return live ? null : endRun({ pid, day, now, why: 'close' });
  if (live || nextHoldKind(rec)) return null;
  return endRun({ pid, day, now, why: 'gone' });
}

/** THE JUDGE's answer for the record (the legs replayed — the phone's word never read), kept on the record once */
async function judged({ record, data, day, pid }) {
  if (record && record.f != null && record.s != null) return record;
  const nodes = await nodesOf(day, record), J = judgeHeld({ seed: data.seed, record, nodes });
  await ref(`${base(day)}/p/${pid}`).update(J).catch(e => console.warn('hr judged', e && e.message));
  return { ...record, ...J };
}

/** 2-floor buckets (0 … 200 → 0 … 100) */
export const HR_BUCKETS = 101;
export const HIGHRISE_DAILY = {
  id: GAME, name: 'HIGH RISE', better: 'high', buckets: HR_BUCKETS,
  bucket: score => hrFloors(score) / 2,
  judged: true,
  held: true,                                         // (THE HELD RUN — api/daily.js: start = startHeld · finish = endRun first · settle = settleHeld)
  moves: ['pause'],                                   // (THE ROOM WINS — a free hold; the 3 player holds are taken by START itself)
  load: day => hrDay(day),
  startHeld, endRun, settle: settleHeld,
  /** the score = THE JUDGE's replay of every leg (the record's legs, the leg nodes' chunks) — the phone's claim is never read */
  async verify(seed, result, { record, data, day, pid, T } = {}) {
    if (!record || !record.e || !data) return null;
    const J = await judged({ record, data, day, pid });
    if (T) T.mark('replay');
    return J.s;
  },
  /** THE ROOM WINS (`pause { room }` — api/daily.js checks the room really started a game): a FREE hold owed — the next START opens it */
  act({ action, record, room = false, roomProof = null }) {
    if (action !== 'pause') return { refused: 'bad_move', status: 400 };
    if (!record || !record.l) return { refused: 'not_started' };
    if (record.e) return { refused: 'done' };
    if (!room) return { refused: 'no_room_game' };
    if (record.room) return { record, resp: { held: 1 } };
    if (holdsOf(record).r >= ROOM_HOLDS) return { refused: 'pause_limit' };
    // (HIGH RISE DAILY B — THE FRESH-EYES REVIEW: a FREE hold = ONE per REAL game start — roomFree: the start's own id never used before,
    //  stamped after the open leg's GO (an interruption of THIS leg), 1+ OTHER player with a profile old enough to count)
    const why = roomFree(record, roomProof);
    if (why) return { refused: why };
    return { record: { ...record, room: 1, rk: { ...(record.rk || {}), [roomKey(roomProof.key)]: 1 } }, resp: { held: 1 } };
  },
  /** what a resumed / ended screen gets without a start: the holds + whether the run is over */
  resume: ({ record, data }) => ({ seed: data && data.seed, holds: holdsOf(record).h, left: holdsLeft(record), ...(record && record.e ? { e: 1 } : {}) }),
  /** FIXES R2 — TAP A TICKET: the finished run's end screen (the judge's own numbers — never a phone's) */
  async endView({ record, data, day, pid }) {
    if (!record || !record.e || !data) return null;
    const J = await judged({ record, data, day, pid });
    return { f: J.f || 0, p: J.p || 0, ms: J.ms || 0, w: J.w || '', h: J.h || 0, ...(J.cut ? { cut: 1 } : {}), ...(J.bad ? { bad: 1 } : {}) };
  },
  /** DAILY B — SHARE TODAY's inputs (SPOILER-FREE — held.js#shareOf: { f, p, w[], x[], pf[] }) + NEW DAILY BEST from the player's own DAILY BEST */
  async share({ record, data, day, pid }) {
    if (!record || !record.e || !data) return null;
    const L = logOf(record, await nodesOf(day, record));
    const S = L.why ? { f: 0, p: 0, w: [], x: [], pf: [] } : shareOf(data.seed, L.events);
    const nb = pid ? bestView(await val(`pstats/${pid}/db/${GAME}`), day).newBest : false;
    // (HIGH RISE DAILY B — `c`: how the run ended, THE JUDGE's word (the own card's poster line) — kept on the record by the finish's judge)
    return { ...S, day: /^d\d{8}$/.test(String(day || '')) ? String(day) : null, nb: nb ? 1 : 0, ...(record.w && !L.why ? { c: String(record.w) } : {}) };
  },
  /** HIGH RISE DAILY B — a HELD run's ticket (`today { prog }`): the floor the run stands on in the SERVER's own log (the legs it has — never the
   *  phone's word) + the holds left → { f, left } | null (no run / ended / a refused log) */
  async progress({ pid, day }) {
    const record = await val(`${base(day)}/p/${pid}`);
    if (!record || record.e || !record.l) return null;
    const [data, nodes] = await Promise.all([hrDay(day), nodesOf(day, record)]);
    const L = logOf(record, nodes);
    if (L.why || !data) return null;
    return { f: floorsAfter(data.seed, L.events), left: holdsLeft(record) };
  },
  /** THE DAY'S CLOSE + `today`'s settle gate (settleHeld does the work) */
  abandon: () => null,
  /** THE PRUNE: the leg nodes past PROOF_DAYS (the run's result stays on its record + the day's score rows) — daily-close.js#sweepRuns */
  pruneDays: PROOF_DAYS + 3,
  async prune({ day, back }) {
    if (back <= PROOF_DAYS) return 0;
    if (Number(await val(`${base(day)}/pr`)) >= 1) return 0;
    await ref('/').update({ [`${base(day)}/w`]: null, [`${base(day)}/pr`]: 1 });
    return 1;
  },
};
export { HOLDS };
