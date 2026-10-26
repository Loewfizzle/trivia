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
  // WIN2 — THE TAP's TRIP: down the thread to the SPEAKEASY word (set below the hub), a crawl back + forth along it for 10–15 s (the
  // stop-start: still / turn / move), the climb home; a second tap mid-way is ignored; home + still again
  const t0 = 600, y0 = sp.state().y, WORD = { x0: web.hub[0] - 60, x1: web.hub[0] + 80, y: web.hub[1] + 96 };
  sp.setWord(WORD);
  assert.ok(sp.near(web.hub[0], web.hub[1] + 2, t0), 'a tap near it');
  sp.step(t0 + 0.5, { motion: true }); assert.ok(sp.state().y > y0 + 20 && sp.state().mode === 'drop', `dropped: ${JSON.stringify(sp.state())}`);
  sp.step(t0 + 2.2, { motion: true }); assert.equal(sp.state().mode, 'crawl'); assert.ok(Math.abs(sp.state().y - WORD.y) < 0.5, `on the word's tubes (y ${sp.state().y} vs ${WORD.y})`);
  let xs = [], subs = new Set(), rev = 0, lastDir = 0;
  for (let t = t0 + 2.2; t < t0 + 11; t += 1 / 30) { sp.step(t, { motion: true }); const st = sp.state(); if (st.mode === 'crawl') { xs.push(st.x); subs.add(st.sub); } }
  for (let i = 1; i < xs.length; i++) { const d = Math.sign(xs[i] - xs[i - 1]); if (d && lastDir && d !== lastDir) rev++; if (d) lastDir = d; }
  assert.ok(Math.max(...xs) - Math.min(...xs) > 12 && rev >= 1 && subs.has('still') && subs.has('move'), `it crawls back + forth along the word (${(Math.max(...xs) - Math.min(...xs)).toFixed(0)} units, ${rev} reversals, ${[...subs].join('/')})`);
  assert.ok(xs.every(x => x >= WORD.x0 + 7 && x <= WORD.x1 - 7), 'never off the word');
  assert.ok(sp.near(sp.state().x, sp.state().y, t0 + 6) && sp.state().mode === 'crawl', 'a second tap mid-way is consumed but does not restart it');
  let climbed = false, home = false;
  for (let t = t0 + 11; t < t0 + 24 && !home; t += 1 / 30) { sp.step(t, { motion: true }); const st = sp.state(); if (st.mode === 'climb') climbed = true; if (climbed && st.mode === 'still' && st.y < y0 + 2) home = true; }
  assert.ok(climbed && home, `climbs back + home within 24 s: ${JSON.stringify(sp.state())}`);
  // ITS NERVES: a flicker beside it → frozen + crouched at once, a skitter, calm again within 6 s; a flicker far away is ignored
  const t1 = t0 + 30; sp.step(t1, { motion: true });
  assert.ok(sp.scare({ kind: 'tap', x: web.hub[0] + 20, k: 0.7 }, t1), 'scared by a flicker beside it');
  sp.step(t1 + 0.1, { motion: true }); assert.ok(sp.state().crouch > 0.3 && sp.state().scared > 0.9 && sp.state().mode === 'scared', `frozen + crouched: ${JSON.stringify(sp.state())}`);
  let skit = false; for (let t = t1 + 0.1; t < t1 + 2; t += 1 / 30) { sp.step(t, { motion: true }); if (sp.state().mode === 'skitter') skit = true; }
  assert.ok(skit, 'it skitters');
  let calm = false; for (let t = t1 + 2; t < t1 + 8 && !calm; t += 1 / 30) { sp.step(t, { motion: true }); const st = sp.state(); calm = st.scared === 0 && st.crouch === 0 && st.mode !== 'scared' && st.mode !== 'skitter'; }
  assert.ok(calm && sp.legCheck().crossed === false, `calm again: ${JSON.stringify(sp.state())}`);
  assert.ok(!sp.scare({ kind: 'tap', x: web.hub[0] + 400, k: 0.4 }, t1 + 20), 'a flicker far away is ignored');
  // reduced motion: still in the hub, the legs settled
  sp.step(t0 + 60, { motion: false }); assert.equal(sp.state().mode, 'still'); assert.equal(sp.legCheck().crossed, false);
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
