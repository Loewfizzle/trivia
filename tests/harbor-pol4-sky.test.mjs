// CITY 2.0 — POLISH 4, GROUP 2 (the owner's 6b review notes 1, 4–7): the pure parts of the sky's fixes — the barnstormer's new route
// (a LOOP AROUND THE O, then THREADING THE LAST N), the 22° halo's + the sun dogs' days, the drone show's hum heard.
import test from 'node:test';
import assert from 'node:assert/strict';
import { barnAt, BARN_PLANE, BARN_SMOKE } from '../js/screens/harbor/barnstorm.js';
import { BARN_LEN } from '../js/core/harbor-legend.js';
import { haloOf } from '../js/core/harbor-clouds.js';
import { slotOf } from '../js/core/city-sounds.js';

const samples = (dt = 0.02) => { const out = []; for (let s = 0; s <= BARN_LEN; s += dt) out.push({ s, ...barnAt(s) }); return out; };

test('THE BARNSTORMER: one smooth flight inside its time — in from the left, out up to the right, never a jump', () => {
  const P = samples();
  assert.ok(P[0].on && P[0].x < -60, 'in from the left, off the sign');
  const last = P.filter(p => p.on).pop();
  assert.ok(last.x > 332 && last.y < 0, `away up to the right (${last.x.toFixed(0)}, ${last.y.toFixed(0)})`);
  for (let i = 1; i < P.length; i++) {
    if (!P[i].on || !P[i - 1].on) continue;
    const d = Math.hypot(P[i].x - P[i - 1].x, P[i].y - P[i - 1].y);
    assert.ok(d < 3.2, `no jump at ${P[i].s.toFixed(2)} s (${d.toFixed(2)} units in 0.02 s)`);
    let da = Math.abs(P[i].ang - P[i - 1].ang); da = Math.min(da, Math.PI * 2 - da);
    assert.ok(da < 0.2, `no snap in the heading at ${P[i].s.toFixed(2)} s`);
  }
  assert.ok(!barnAt(-0.1).on && !barnAt(BARN_LEN + 0.1).on, 'nothing outside its flight');
  assert.ok(BARN_PLANE >= 40 && BARN_SMOKE >= 8, 'a premium-sized plane; its smoke hangs ~10 s');
});

test('THE BARNSTORMER LOOPS AROUND THE O (the whole ring round the letter, never across it), then THREADS THE LAST N', () => {
  const P = samples().filter(p => p.loop != null);
  assert.ok(P.length > 50, 'a loop is flown');
  // the O: its box 176..240 × 0..100 (logo units) — the loop goes all the way round it: above it, below it, left + right of it
  const O = { x0: 176, x1: 240, y0: 0, y1: 100 };
  assert.ok(P.some(p => p.y < O.y0) && P.some(p => p.y > O.y1) && P.some(p => p.x < O.x0) && P.some(p => p.x > O.x1), 'round the O on every side');
  for (const p of P) assert.ok(!(p.x > O.x0 + 6 && p.x < O.x1 - 6 && p.y > O.y0 + 6 && p.y < O.y1 - 6), `never inside the O's ring (${p.x.toFixed(0)}, ${p.y.toFixed(0)})`);
  // it climbs through the inside of the loop: up the right side (heading up), inverted over the top (heading left), down the left
  const top = P.reduce((a, b) => (b.y < a.y ? b : a));
  assert.ok(Math.abs(Math.abs(top.ang) - Math.PI) < 0.35, 'inverted over the top (heading left)');
  // then THROUGH THE LAST N (x 268..332): it crosses the left upright low, the diagonal in the middle, the right upright high
  const after = samples().filter(p => p.on && p.loop == null && p.s > P[P.length - 1].s);
  const at = x => after.find(p => p.x >= x);
  const a = at(268), b = at(332);
  assert.ok(a && b && a.y > b.y && a.y > 40 && a.y < 100 && b.y > 0 && b.y < 50, `climbing through the N: its left upright at y ${a && a.y.toFixed(0)}, its right at ${b && b.y.toFixed(0)}`);
});

test('THE 22° HALO on ~1 veil day in 4, THE SUN DOGS on ~half of those (seeded: every phone the same); the previews force them', () => {
  let halo = 0, dogs = 0, n = 0;
  for (let d = 0; d < 730; d++) {
    const t = new Date(Date.UTC(2026, 0, 1) + d * 864e5), lc = { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() };
    const h = haloOf(lc); n++;
    if (h.halo) halo++;
    if (h.dogs) { dogs++; assert.ok(h.halo, 'sun dogs only with the halo'); }
    assert.deepEqual(haloOf(lc), h, 'the same for everyone');
  }
  assert.ok(halo / n > 0.18 && halo / n < 0.32, `the halo ~1 day in 4 (${(halo / n).toFixed(2)})`);
  assert.ok(dogs / halo > 0.3 && dogs / halo < 0.7, `the sun dogs on ~half of the halo days (${(dogs / halo).toFixed(2)})`);
  assert.ok(haloOf(null, { halo: true }).halo && !haloOf(null, { halo: true }).dogs, '&force=halo: the ring');
  const f = haloOf(null, { dogs: true });
  assert.ok(f.halo && f.dogs, '&force=sundogs: the ring + the dogs');
});

test('THE DRONE SHOW is HEARD: its swarm hum a soft bed under the helicopter, no longer ~20 dB under everything', () => {
  const s = slotOf('drone-swarm');
  assert.equal(s.kind, 'loop');
  assert.ok(s.gain >= 0.14 && s.gain < slotOf('helicopter').gain * 1.6, `the swarm's gain ${s.gain}`);
});

test('THE DRONE SHOW IS A MESSAGE (the owner): every holiday flies words only; the drones rise straight into page 1, each page held ~15 s', async () => {
  const { SKY_HOLIDAYS, droneTimeline, DRONE_READ } = await import('../js/core/harbor-sky.js');
  for (const h of SKY_HOLIDAYS) assert.ok(h.night.show.length && h.night.show.every(sp => sp.text != null && !sp.shape), `${h.id}: a message, no figures`);
  const tl = droneTimeline(3);
  assert.equal(tl.shapes[0].t0, tl.launch, 'page 1 formed by the launch itself (no staging, no opening figure)');
  assert.equal(tl.shapes[0].morph, 0);
  assert.ok(DRONE_READ >= 15 && tl.shapes.every(s => s.hold >= DRONE_READ), 'every page held readable ~15 s, like skytyping');
  assert.equal(tl.scatter, tl.shapes[2].t0 + tl.shapes[2].morph + tl.shapes[2].hold, 'then the disperse');
});
