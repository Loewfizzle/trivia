// CITY 2.0 — POLISH 4, GROUP 2 (the owner's 6b review notes 1, 4–7): the pure parts of the sky's fixes — (the barnstormer removed in
// POLISH 5) the 22° halo's + the sun dogs' days, the drone show's hum heard.
import test from 'node:test';
import assert from 'node:assert/strict';
import { haloOf } from '../js/core/harbor-clouds.js';
import { slotOf } from '../js/core/city-sounds.js';

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

test('POLISH 5 — A SKY MESSAGE PAGE HOLDS THREE LINES as wide as "HAPPY BIRTHDAY" (the owner: three of them in a row on one page)', async () => {
  const { messagePages, MSG } = await import('../js/core/harbor-sky.js');
  assert.ok(MSG.lines === 3 && MSG.max >= 16, 'three lines of up to 16 a page');
  assert.deepEqual(messagePages('HAPPY BIRTHDAY HAPPY BIRTHDAY HAPPY BIRTHDAY', { aspect: 1.3 }), [['HAPPY BIRTHDAY', 'HAPPY BIRTHDAY', 'HAPPY BIRTHDAY']]);
  assert.equal(messagePages('HAPPY BIRTHDAY JESSICA', { aspect: 1.3 }).length, 1, 'one page');
  assert.deepEqual(messagePages('HI', { aspect: 1.3 }), [['HI']]);
});
