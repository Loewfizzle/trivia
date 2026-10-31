// SKY-A — THE BLACKBIRD: core/harbor-blackbird.js (one flyby, its triggers: the chase, the solo sightings, the watcher's reward). PURE.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BB, bbAt, bbLife, bbChaseAt, soloDay, soloNear, watcherStep } from '../js/core/harbor-blackbird.js';
import { CHASE, chaseX, legendNight, TR3B_LEN, TR3B_HOURS } from '../js/core/harbor-legend.js';
import { knob } from '../js/core/harbor-schedule.js';

const OFF = -240, at = iso => Date.parse(iso) / 1000;

test('THE FLYBY: the tell before it, the cone just after it enters, the ring, full Mach diamonds from the cone, the double boom late', () => {
  assert.ok(bbAt(-2).tell && !bbAt(-2).on, 'the static tell before it enters');
  assert.ok(bbAt(0.05).on && bbAt(0.05).cone === 0 && bbAt(0.05).burn < 0.7, 'enters on a partial burn');
  const c = bbAt(BB.cone + BB.coneIn + 0.1);
  assert.ok(c.cone > 0.99 && c.ring && c.ring.k > 0 && c.burn > 0.95, `the vapor cone (${c.cone.toFixed(2)}) + the ring + full burn`);
  // SKY-B — CENTRE STAGE + IT LINGERS (the owner): it forms with the craft's middle near the screen's centre (402 pt, a 96-pt body), holds,
  // then dissipates slowly — ~1.5–2 s in all; the ring with it
  const noseAt = u => -0.2 * 96 + u * (402 + 0.2 * 96), mid = noseAt(c.coneU) - 48;
  assert.ok(Math.abs(mid - 201) < 40, `the barrier breaks centre stage (the craft's middle at ${mid.toFixed(0)} of 402)`);
  // (MODELS — the owner: it LASTS — full through ~2.5–3 s, then a slow dissolve)
  assert.ok(bbAt(BB.cone + 2.3).cone > 0.99 && bbAt(BB.cone + 2.6).cone < 0.99, `still full at 2.3 s (${bbAt(BB.cone + 2.3).cone.toFixed(2)}), dissolving by 2.6 s (ATM-A)`);
  const mf = BB.coneIn + BB.coneHold + BB.coneFade * 0.5;
  assert.ok(bbAt(BB.cone + mf).cone > 0.05 && bbAt(BB.cone + mf).cone < 0.7, `still there + fading at ${mf.toFixed(1)} s (${bbAt(BB.cone + mf).cone.toFixed(2)})`);
  const gone = BB.coneIn + BB.coneHold + BB.coneFade;
  assert.ok(gone >= 4.5 && gone <= 6 && bbAt(BB.cone + gone + 0.01).cone === 0, `the cone's whole life ${gone.toFixed(2)} s (ATM-A: ~2.3 s held + the ~2.6 s dissolve)`);
  assert.ok(Math.abs(BB.coneHold - 2.6 * 0.9) < 0.02 && BB.coneFade === 2.6, 'ATM-A — the owner: the cone 10 % shorter in the air (~2.6 → ~2.3 s), the slow dissolve kept');
  for (let s = 0; s < gone; s += 0.05) assert.ok(bbAt(BB.cone + s + 0.05).cone <= bbAt(BB.cone + s).cone + 1e-9 || s < BB.coneIn, 'it only fades once it has bloomed');
  assert.ok(BB.ring >= 1.5 && bbAt(BB.cone + BB.ring + 0.01).ring === null, 'the ring fades with it');
  assert.equal(bbAt(BB.cone + BB.boom - 0.01).boom, null);
  assert.ok(Math.abs(bbAt(BB.cone + BB.boom + 0.1).boom - 0.1) < 1e-9, 'the boom ~0.9 s after the cone');
  assert.ok(BB.boomGap >= 0.15 && BB.boomGap <= 0.3, '"ba-BOOM": the second hit 0.15–0.3 s later');
  assert.ok(BB.cross >= 1 && BB.cross <= 1.5, 'straight across in ~1–1.5 s');
  // much faster than the jets: the chase crosses 1.5 screens in CHASE.dur
  assert.ok(1 / BB.cross > 1.6 * (1.5 / CHASE.dur), 'much faster than the F-22s');
  // (it enters as the jets' lead is ⅓ across + leaves the far edge before that lead does)
  assert.ok(BB.cross < (1 - knob('blackbird.chase').jetsAcross) / (1.5 / CHASE.dur), 'gone before the jets');
  const life = bbLife(402, 68); assert.ok(bbAt(life + 0.1, 402, 68).done && !bbAt(1, 402, 68).done, `gone after its life (${life.toFixed(1)} s)`);
});

test('THE LEGENDS’ REGISTRY (THE CITY TIMETABLE): every legendary has its row, its numbers agree with the code that rolls them', () => {
  for (const id of ['legend.ufo', 'legend.tr3b', 'legend.ghostship', 'legend.flyby', 'legend.mothman', 'legend.rule', 'blackbird.chase', 'blackbird.solo', 'blackbird.watcher']) assert.ok(knob(id), id);
  assert.deepEqual(knob('legend.tr3b').hours, TR3B_HOURS);
});

test('THE CHASE: the Blackbird enters once the F-22s are ~⅓ across, before the power comes back', () => {
  const s = bbChaseAt(), u = (s - CHASE.t0) / CHASE.dur;
  assert.ok(Math.abs(chaseX(u, 0) - knob('blackbird.chase').jetsAcross) < 1e-9, `the lead ⅓ across at ${s.toFixed(2)} s`);
  assert.ok(s + BB.cross < TR3B_LEN, 'inside the TR-3B');
});

test('THE SOLO SIGHTINGS: rare (~2 a month), every phone the same, never on a legendary night; ~5 passes on July 4', () => {
  let n = 0, months = 0, lg = 0;
  for (let d = 0; d < 365; d++) {
    const t = at('2027-01-01T12:00:00-05:00') + d * 86400, L = soloDay(t, OFF);
    n += L.length;
    const D = new Date((t + OFF * 60) * 1000);
    if (L.length && legendNight(D.getUTCFullYear(), D.getUTCMonth() + 1, D.getUTCDate())) lg++;
    assert.deepEqual(soloDay(t, OFF), L, 'the same on every phone');
    for (const f of L) { const h = ((f.t + OFF * 60) / 3600 % 24 + 24) % 24; assert.ok(h >= knob('blackbird.solo').from - 0.01 && h <= 23.01 || /\.j/.test(f.id), `its hour ${h.toFixed(2)}`); assert.ok(f.dir === 1 || f.dir === -1); }
  }
  months = 12;
  const j4 = soloDay(at('2027-07-04T12:00:00-04:00'), OFF);
  assert.equal(j4.length, 5, 'five passes on July 4');
  const rest = n - j4.length;
  assert.ok(rest >= 10 && rest <= 40, `${rest} solo sightings a year (~2 a month)`);
  assert.equal(lg, 0, 'never on a legendary night');
  const f = j4[2]; assert.deepEqual(soloNear(f.t + 1, OFF), f, 'joined just after it entered'); assert.deepEqual(soloNear(f.t - 2, OFF), f, 'the tell before it');
});

test('THE WATCHER\'s REWARD: 60 visible minutes — a short break only pauses it, a long one resets it; once a device a day', () => {
  const W = knob('blackbird.watcher');
  let st = null, fired = 0, t = 1000;
  const run = (secs, vis = true) => { for (let k = 0; k < secs; k += W.step) { t += W.step; const r = watcherStep(st, t, vis, 'd1'); st = r.state; if (r.fire) fired++; } };
  run(40 * 60);
  t += 4 * 60;              // (locked 4 minutes: paused)
  run(19 * 60);
  assert.equal(fired, 0, 'not yet: 59 minutes watched');
  run(2 * 60);
  assert.equal(fired, 1, 'the reward at 60 visible minutes');
  run(90 * 60);
  assert.equal(fired, 1, 'once a day');
  // a long break resets the count
  st = null; fired = 0; t = 1000;
  run(50 * 60); t += 6 * 60; run(15 * 60);
  assert.equal(fired, 0, 'a 6-minute break reset it');
  run(50 * 60); assert.equal(fired, 1);
  // the next day: again
  const r = watcherStep(st, t + 5, true, 'd2'); assert.ok(r.state.acc <= W.step, 'a new day starts over');
});

test('SKY-B — THE RADIO CRACKLE IS HEARD (the owner: "missing / too quiet", music on or off): an EFFECT on the effects bus, its level up with the boom + the scream (the files are all normalized alike)', async () => {
  const { slotOf } = await import('../js/core/city-sounds.js');
  const st = slotOf('bb-static'), sc = slotOf('bb-scream'), bm = slotOf('bb-boom');
  assert.ok(st.gain >= 0.8 * sc.gain && st.gain >= 0.6 * bm.gain, `the crackle ${st.gain} vs the scream ${sc.gain} + the boom ${bm.gain}`);
});

test('MODELS — THE SONIC BOOM IS THE LOUDEST THING IN THE GAME (the owner, Oct 30 6:43 pm): +10 % on SKY-B\'s level, above every other city sound', async () => {
  const { SLOTS } = await import('../js/core/city-sounds.js');
  const boom = SLOTS.find(s => s.id === 'bb-boom');
  assert.ok(Math.abs(boom.gain - 0.24 * 1.1) < 1e-9, `+10 % (${boom.gain})`);
  const louder = SLOTS.filter(s => s.id !== 'bb-boom' && s.gain >= boom.gain).map(s => `${s.id} ${s.gain}`);
  assert.deepEqual(louder, [], 'nothing as loud');
});
