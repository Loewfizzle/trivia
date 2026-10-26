// SP4 — THE BIO-MECHANICAL SPIDER on the NEON sign (js/screens/harbor/dress-halloween.js): its legs can never tangle — every foot
// stays inside its leg's own sector of the body, the legs on each side keep their order — through ten minutes of its life (bursts
// out along the radials, turns, drops) + a tap; and the web's shimmer only runs on spun threads.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { WEB_SPECS, buildWeb, createSpider, createShimmer, legSectors, SECTOR } from '../js/screens/harbor/dress-halloween.js';

test('the legs sit in distinct sectors (neighbours ≥ 2 × the hard limit apart: a foot inside its sector can never cross the next leg)', () => {
  const S = legSectors();
  for (let i = 1; i < S.length; i++) assert.ok(S[i - 1] - S[i] > SECTOR.hard * 2, `legs ${i} / ${i + 1}: ${(S[i - 1] - S[i]).toFixed(2)} rad apart`);
});

test('ten minutes of its life at 60 fps: no foot past the hard limit, no crossing, every mode visited, a tap sends it down its thread', () => {
  const web = buildWeb(WEB_SPECS[0]), sp = createSpider(web, { seed: 11 });
  sp.setReach(34);
  const modes = new Set(); let maxDev = 0, crossings = 0, steps = 0;
  for (let t = 0; t < 600; t += 1 / 60) {
    sp.step(t, { motion: true });
    const c = sp.legCheck(), st = sp.state();
    modes.add(st.mode); steps += st.stepping;
    maxDev = Math.max(maxDev, c.maxDev); if (c.crossed) crossings++;
  }
  assert.ok(maxDev < 0.31, `the furthest a foot strayed from its sector: ${maxDev.toFixed(3)} rad (hard ${SECTOR.hard}; half the sectors' gap is 0.31 — the geometric proof)`);
  assert.equal(crossings, 0, 'the legs never crossed');
  for (const m of ['still', 'turn', 'move', 'drop', 'hang', 'climb']) assert.ok(modes.has(m), `it ${m}s`);
  assert.ok(steps > 100, 'the feet step');
  // a tap: it bolts down (the hang grows within half a second), hangs, climbs home by 9 s
  const t0 = 600, y0 = sp.state().y;
  assert.ok(sp.near(web.hub[0], web.hub[1] + 2, t0), 'a tap near it');
  sp.step(t0 + 0.5, { motion: true }); assert.ok(sp.state().y > y0 + 20 && /drop|hang/.test(sp.state().mode), `dropped: ${JSON.stringify(sp.state())}`);
  sp.step(t0 + 3, { motion: true }); assert.equal(sp.state().mode, 'hang');
  sp.step(t0 + 8.5, { motion: true }); assert.equal(sp.state().mode, 'climb');
  let home = false; for (let t = t0 + 9; t < t0 + 20 && !home; t += 1 / 30) { sp.step(t, { motion: true }); home = sp.state().y < y0 + 2; }
  assert.ok(home, `home within 20 s: ${JSON.stringify(sp.state())}`);
  // reduced motion: still in the hub, the legs settled
  sp.step(t0 + 10, { motion: false }); assert.equal(sp.state().mode, 'still'); assert.equal(sp.legCheck().crossed, false);
});

test('the shimmer: no pulses on an unspun web, pulses on a spun one, none under reduced motion', () => {
  const webs = WEB_SPECS.map(buildWeb), sh = createShimmer(webs);
  for (let t = 0; t < 20; t += 1 / 30) sh.step(t, { motion: true, growth: [0.05, 0] });
  assert.equal(sh.state(), 0, 'nothing to run along yet');
  let seen = 0;
  for (let t = 20; t < 40; t += 1 / 30) { sh.step(t, { motion: true, growth: [1, 1] }); seen = Math.max(seen, sh.state()); if (sh.moving()) for (const b of sh.boxes()) assert.ok(b.x1 > b.x0 && b.y1 > b.y0); }
  assert.ok(seen >= 1 && seen <= 3, `pulses ${seen}`);
  sh.step(41, { motion: false, growth: [1, 1] }); assert.equal(sh.moving(), false);
});
