// PART 10 Group 0 — THE SILENT FLASHES (the owner, Oct 31 8:10 pm: "some BIG, BRIGHT, CLOSE-looking flashes make NO SOUND, or it's so
// delayed I can't connect it"): every flash bright enough to light the scene gets its thunder — a close one within ~0.5 s, a far / an
// intra-cloud one a roll within a few seconds — in a whole simulated storm (the real lightning planner + the real thunder timing rules).
import test from 'node:test';
import assert from 'node:assert/strict';
const { createLightning, thunderDelay, LIGHTNING } = await import('../js/screens/harbor/lightning.js');
const { thunderWhen, thunderLevel, thunderVerdict, THUNDER } = await import('../js/core/city-sounds.js');

// a storm for `mins` minutes at 60 fps → every strike's event + its flash time (s); close strikes' recorded crack sits `hit` s into its take
function storm(mins, opts) {
  const evs = [];
  const z = createLightning({ onStrike: ev => { evs.push({ ...ev, at: tNow }); return { lead: 0.25, second: null }; } });
  z.resize(402, 874, 600);
  let tNow = 0;
  for (let f = 0; f < mins * 60 * 60; f++) {
    tNow = f / 60;
    z.tick({ on: true, t: tNow, motion: true, base: 120, horizon: 560, needle: [200, 300], skyline: Array.from({ length: 60 }, (_, i) => 420 + (i % 7) * 12), near: Array.from({ length: 60 }, (_, i) => 470 + (i % 5) * 10), water: { y0: 600, y1: 700 }, occ: [], ...opts });
  }
  return { evs, n: z.debug().strikes };
}
// the sounds' scheduling (sounds.js#thunder): close → at once (the crack on the flash + its delay); a roll → thunderWhen after the last
function schedule(evs, when = thunderWhen) {
  const thunders = [], out = [];
  for (const ev of evs) {
    const now = ev.at * 1000;
    if (ev.kind === 'close') { thunders.push(now); out.push({ ...ev, heard: ev.delay }); continue; }
    const at = now + ev.delay * 1000, w = when(at, thunders.length ? thunders[thunders.length - 1] : null);
    thunders.push(w); out.push({ ...ev, heard: (w - now) / 1000 });
  }
  return out;
}
const OLD = (at, last) => (last != null ? Math.max(at, last + 6000) : at);   // (the queue before this pass)

test('every strike is told + carries its brightness', () => {
  for (const o of [{}, { force: true }, { close: true }]) {
    const { evs, n } = storm(10, o);
    assert.ok(n > 20, `strikes ${n}`);
    assert.equal(evs.length, n, 'every strike calls the thunder');
    for (const e of evs) assert.ok(e.bright > 0.5 && e.bright <= 1, `bright ${e.bright}`);
  }
});

test('a close flash booms within 0.5 s; every roll within FAR_MAX + SLACK — in a busy storm too', () => {
  for (const o of [{}, { force: true }, { close: true }]) {
    const out = schedule(storm(20, o).evs);
    for (const e of out) {
      if (e.kind === 'close') assert.ok(e.heard <= THUNDER.CLOSE_MAX, `close ${e.heard}`);
      else assert.ok(e.heard <= 3 + THUNDER.SLACK + 1e-6, `${e.kind} heard ${e.heard.toFixed(2)} s after its flash`);
      assert.equal(thunderVerdict({ ...e, why: 'played' }), 'ok');
    }
  }
});

test('the cause: the old 6-s queue left forced-storm flashes far behind their thunder', () => {
  const evs = storm(20, { force: true }).evs;
  const old = schedule(evs, OLD), worst = Math.max(...old.filter(e => e.kind !== 'close').map(e => e.heard));
  assert.ok(worst > 5, `the old queue's worst lag ${worst.toFixed(1)} s`);
});

test('an intra-cloud flash is a heard low rumble; a far one by its distance', () => {
  assert.ok(thunderLevel({ kind: 'ic', bright: 0.9 }) >= 0.7);
  assert.ok(thunderLevel({ kind: 'ic', bright: 0.3 }) >= 0.4, 'never under ~0.4 (was 0.25, undamped under the music)');
  assert.ok(thunderLevel({ kind: 'far', level: 0.6 }) >= 0.45);
  assert.ok(thunderDelay(0.4, true) <= 0.5 && thunderDelay(1.6, true) <= 0.5);
});

test('thunderWhen: spaced when it can be, never more than SLACK late', () => {
  assert.equal(thunderWhen(1000, null), 1000);
  assert.equal(thunderWhen(10000, 8000), 10500);          // (0.5 s late: spaced)
  assert.equal(thunderWhen(10000, 1000), 10000);          // (the last long gone)
  assert.equal(thunderWhen(10000, 9900), 10000);          // (would be 2.4 s late → on time over the tail)
});

test('the verdicts', () => {
  assert.equal(thunderVerdict({ kind: 'close', heard: 0.3 }), 'ok');
  assert.equal(thunderVerdict({ kind: 'close', heard: 1.4 }), 'LATE');
  assert.equal(thunderVerdict({ kind: 'far', why: 'locked' }), 'muted');
  assert.equal(thunderVerdict({ kind: 'far', bright: 0.9, why: 'queued' }, 1), 'waiting');
  assert.equal(thunderVerdict({ kind: 'far', bright: 0.9, why: 'no sound' }, 1), 'SILENT');
  assert.equal(thunderVerdict({ kind: 'close', bright: 0.9, why: 'queued' }, 9), 'SILENT');
  assert.ok(LIGHTNING.CAP > 0);
});
