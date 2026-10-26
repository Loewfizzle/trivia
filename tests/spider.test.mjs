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
  sp.setReach(34, 1);
  const modes = new Set(); let maxDev = 0, crossings = 0, steps = 0, loop = 0, maxLoop = 0, last = null;
  for (let t = 0; t < 600; t += 1 / 60) {
    sp.step(t, { motion: true });
    const c = sp.legCheck(), st = sp.state();
    modes.add(st.mode); steps += st.stepping;
    if (st.mode === 'move' && last) loop += Math.hypot(st.x - last.x, st.y - last.y); if (st.far < 1 && st.mode === 'still') { maxLoop = Math.max(maxLoop, loop); loop = 0; } last = st;
    maxDev = Math.max(maxDev, c.maxDev); if (c.crossed) crossings++;
  }
  // SP5 — THE ROAM (the owner: at least a letter's length along its tubes / web): one excursion walks ≥ 38 units (a SPEAKEASY letter) out + back
  assert.ok(maxLoop >= 2 * 38, `it roams at least a letter's length out along its web + tubes: the longest loop ${maxLoop.toFixed(0)} units (≥ 76 out + back)`);
  assert.ok(maxDev < 0.31, `the furthest a foot strayed from its sector: ${maxDev.toFixed(3)} rad (hard ${SECTOR.hard}; half the sectors' gap is 0.31 — the geometric proof)`);
  assert.equal(crossings, 0, 'the legs never crossed');
  for (const m of ['still', 'turn', 'move', 'drop', 'hang', 'climb']) assert.ok(modes.has(m), `it ${m}s`);
  assert.ok(steps > 100, 'the feet step');
  // WIN2 — THE TAP's TRIP: down the thread to the SPEAKEASY word (set below the hub), a crawl back + forth along it for 10–15 s (the
  // stop-start: still / turn / move), the climb home; a second tap mid-way is ignored; home + still again
  let t0 = 600; while (!(sp.state().mode === 'still' && sp.state().far < 1) && t0 < 760) { t0 += 1 / 60; sp.step(t0, { motion: true }); }   // (SP5: it roams farther — wait for it in the hub)
  const y0 = sp.state().y, WORD = { x0: web.hub[0] - 60, x1: web.hub[0] + 80, y: web.hub[1] + 96 };
  sp.setWord(WORD);
  assert.ok(sp.state().far < 1, 'home in the hub');
  assert.ok(sp.near(web.hub[0], web.hub[1] + 2, t0), 'a tap near it');
  // WIN3 — THE DANGLE (the owner): the legs gather into a tuck before it goes (no foot past ~half its stance), it hangs BELOW the thread
  // head-down turning slowly, touches down with the front legs unfolding a little (never stretched to the letters: the body is never
  // more than LAND_H above the tubes with its legs out), then stands on the word
  { let gathered = false, minReach = 1, spun = false, stretched = 0, mid = null, maxStretch = 0;
    for (let t = t0; t < t0 + 2.3; t += 1 / 60) { sp.step(t, { motion: true }); const st = sp.state(); if (st.pose === 'tuck' && st.reach < 0.55 && st.y < y0 + 6) gathered = true; minReach = Math.min(minReach, st.reach); if (st.spin > 0.5) spun = true; if (st.reach > 0.7 && st.y > y0 + 10 && st.y < WORD.y - 16) stretched++; if (!mid && t >= t0 + 1.2) mid = st; const c = sp.legCheck(); assert.equal(c.crossed, false, `no crossing while dangling at ${(t - t0).toFixed(2)} s`); if (t > t0 + 0.5) maxStretch = Math.max(maxStretch, c.maxStretch); }
    // SP5 (the owner's bug: the feet stayed pinned to the web and the legs stretched as the body fell): the feet LET GO — every leg's
    // hip → foot distance stays well inside its length all the way down (a tucked leg ≈ 0.4 of its reach; the old bug read > 1)
    assert.ok(maxStretch < 0.62, `the legs gather with the body on the drop — the longest leg at ${maxStretch.toFixed(2)} of its length (pinned feet would stretch past 1)`);
    assert.ok(gathered && minReach < 0.45 && spun && stretched === 0, `the dangle: gathered first ${gathered}, the tightest reach ${minReach.toFixed(2)}, spun ${spun}, frames with the legs stretched toward the letters ${stretched}`);
    assert.ok(mid && mid.y > y0 + 20 && mid.mode === 'drop' && mid.pose === 'tuck', `dropped, tucked at 1.2 s: ${JSON.stringify(mid)}`); }
  sp.step(t0 + 2.6, { motion: true }); assert.equal(sp.state().mode, 'land', 'landing feet-first'); assert.ok(sp.legCheck().maxStretch < 0.85, `the legs unfold toward the stance as it lands (${sp.legCheck().maxStretch.toFixed(2)})`);
  sp.step(t0 + 3.3, { motion: true }); assert.equal(sp.state().mode, 'crawl'); assert.ok(Math.abs(sp.state().y - WORD.y) < 0.5, `on the word's tubes (y ${sp.state().y} vs ${WORD.y})`);
  let xs = [], subs = new Set(), rev = 0, lastDir = 0;
  for (let t = t0 + 3.3; t < t0 + 11; t += 1 / 30) { sp.step(t, { motion: true }); const st = sp.state(); if (st.mode === 'crawl') { xs.push(st.x); subs.add(st.sub); } }
  for (let i = 1; i < xs.length; i++) { const d = Math.sign(xs[i] - xs[i - 1]); if (d && lastDir && d !== lastDir) rev++; if (d) lastDir = d; }
  assert.ok(Math.max(...xs) - Math.min(...xs) > 12 && rev >= 1 && subs.has('still') && subs.has('move'), `it crawls back + forth along the word (${(Math.max(...xs) - Math.min(...xs)).toFixed(0)} units, ${rev} reversals, ${[...subs].join('/')})`);
  assert.ok(xs.every(x => x >= WORD.x0 + 7 && x <= WORD.x1 - 7), 'never off the word');
  assert.ok(sp.near(sp.state().x, sp.state().y, t0 + 6) && sp.state().mode === 'crawl', 'a second tap mid-way is consumed but does not restart it');
  let climbed = false, home = false, reeled = false;
  for (let t = t0 + 11; t < t0 + 24 && !home; t += 1 / 30) { sp.step(t, { motion: true }); const st = sp.state(); if (st.mode === 'climb') climbed = true; if (st.mode === 'climb' && st.pose === 'reel' && st.head === -1 && st.reach < 0.55) reeled = true; if (climbed && st.mode === 'still' && st.y < y0 + 2) home = true; assert.equal(sp.legCheck().crossed, false, 'no crossing on the way home'); }
  assert.ok(climbed && reeled && home, `climbs back head-up reeling the line, legs gathered (${reeled}) + home within 24 s: ${JSON.stringify(sp.state())}`);
  // ITS NERVES: a flicker beside it → frozen + crouched at once, a skitter, calm again within 6 s; a flicker far away is ignored
  const t1 = t0 + 30; sp.step(t1, { motion: true });
  assert.ok(sp.scare({ kind: 'tap', x: web.hub[0] + 20, k: 0.7 }, t1), 'scared by a flicker beside it');
  sp.step(t1 + 0.1, { motion: true }); assert.ok(sp.state().crouch > 0.3 && sp.state().scared > 0.9 && sp.state().mode === 'scared', `frozen + crouched: ${JSON.stringify(sp.state())}`);
  // SP5 — A BIGGER SCARE (the owner): a panicked dash FARTHER (≥ 20 units) + FASTER (≤ 0.45 s, the legs blurring) away from the flicker
  // (to the +x side: it bolts the other way), a hold out there, then a SLOW WARY RETURN (≥ 3 s of creeping bursts) before it is calm
  let skit = 0, dashFar = 0, blur = 0, dashEnd = -1, wrongWay = 0;
  for (let t = t1 + 0.1; t < t1 + 2; t += 1 / 60) { sp.step(t, { motion: true }); const st = sp.state(); if (st.mode === 'skitter') { skit++; dashFar = Math.max(dashFar, st.far); blur = Math.max(blur, st.blur); dashEnd = t; if (st.x > web.hub[0] + 2) wrongWay++; } assert.equal(sp.legCheck().crossed, false, 'no crossing in the dash'); }
  assert.ok(skit > 0 && skit / 60 <= 0.45 && dashFar >= 20 && blur > 0.9 && wrongWay === 0, `the dash: ${(skit / 60).toFixed(2)} s, ${dashFar.toFixed(0)} units out, the blur ${blur}, away from the flicker (${wrongWay} frames toward it)`);
  let calm = false, wary = 0, calmAt = -1;
  for (let t = t1 + 2; t < t1 + 16 && !calm; t += 1 / 30) { sp.step(t, { motion: true }); const st = sp.state(); if (st.wary) wary++; calm = st.scared === 0 && st.crouch === 0 && st.mode !== 'scared' && st.mode !== 'skitter' && !st.wary; if (calm) calmAt = t; }
  assert.ok(calm && sp.legCheck().crossed === false, `calm again: ${JSON.stringify(sp.state())}`);
  assert.ok(wary / 30 >= 3 && calmAt - dashEnd >= 4 && sp.state().far < 1.5, `the slow wary return: ${(wary / 30).toFixed(1)} s of creeping, home ${(calmAt - dashEnd).toFixed(1)} s after the dash (${sp.state().far} from the hub)`);
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

// SP5 — TWO SPIDERS, INDEPENDENT (the owner: they mirrored each other): their own seeds, timings, pauses + paths — never in step
test('two spiders never move in step: different modes most of the time, their leg lifts + their scares on their own clocks', () => {
  const webs = WEB_SPECS.map(buildWeb), A = createSpider(webs[0], { seed: 11 }), B = createSpider(webs[1], { seed: 23 });
  A.setReach(34, 1); B.setReach(18, 1);
  let frames = 0, same = 0, bothMove = 0, aMove = 0, bMove = 0, liftsTogether = 0, lifts = 0, farB = 0, loopB = 0, lastB = null;
  for (let t = 0; t < 600; t += 1 / 60) {
    A.step(t, { motion: true }); B.step(t, { motion: true });
    const a = A.state(), b = B.state(); frames++;
    if (a.mode === b.mode) same++;
    const am = a.mode === 'move' || a.mode === 'turn', bm = b.mode === 'move' || b.mode === 'turn';
    if (am) aMove++; if (bm) bMove++; if (am && bm) bothMove++;
    if (a.mode === 'still' && b.mode === 'still') { if (a.stepping || b.stepping) lifts++; if (a.stepping && b.stepping) liftsTogether++; }
    if (b.mode === 'move' && lastB) loopB += Math.hypot(b.x - lastB.x, b.y - lastB.y); if (b.far < 1 && b.mode === 'still') { farB = Math.max(farB, loopB); loopB = 0; } lastB = b;
    assert.equal(A.legCheck().crossed || B.legCheck().crossed, false, 'no crossing');
  }
  assert.ok(same / frames < 0.75 && bothMove < 0.35 * Math.min(aMove, bMove), `not in step: the same mode ${(100 * same / frames).toFixed(0)} % of the time, moving together ${bothMove} of ${aMove} / ${bMove} moving frames`);
  assert.ok(liftsTogether < 0.2 * lifts, `their leg lifts on their own grids: ${liftsTogether} of ${lifts} together`);
  assert.ok(farB >= 2 * 38, `the corner spider roams a letter's length too (out along the N's tubes + back): the longest loop ${farB.toFixed(0)} units`);
  // SP5: tapped while out on its roam it runs to the hub first, then drops (never a snap to the hub)
  { let t = 600; while (!(B.state().mode === 'move' && B.state().far > 12) && t < 900) { t += 1 / 60; B.step(t, { motion: true }); A.step(t, { motion: true }); }
    const st = B.state(); assert.ok(st.far > 12, `caught out on the web at ${st.far}`); assert.ok(B.near(st.x, st.y, t), 'tapped there');
    let ran = 0, jump = 0, prev = st, dropped = false;
    for (let u = t; u < t + 3.5 && !dropped; u += 1 / 60) { B.step(u, { motion: true }); const n = B.state(); if (n.trip === 'tohub') ran++; if (Math.hypot(n.x - prev.x, n.y - prev.y) > 4) jump++; if (n.trip === 'drop') dropped = true; prev = n; }
    assert.ok(ran > 3 && jump === 0 && dropped, `it ran to the hub (${ran} frames, ${jump} jumps) and dropped (${dropped})`); }
  // one flicker on the sign reaches both — each bolts on its OWN reaction time, its own way
  const t1 = 600; A.step(t1, { motion: true }); B.step(t1, { motion: true });
  assert.ok(A.scare({ kind: 'race', k: 0.8 }, t1) && B.scare({ kind: 'race', k: 0.8 }, t1), 'both scared');
  let aGo = -1, bGo = -1, aTo = null, bTo = null;
  for (let t = t1; t < t1 + 3; t += 1 / 120) { A.step(t, { motion: true }); B.step(t, { motion: true }); const a = A.state(), b = B.state(); if (aGo < 0 && a.mode === 'skitter') aGo = t; if (bGo < 0 && b.mode === 'skitter') bGo = t; if (a.mode === 'skitter') aTo = [a.x - webs[0].hub[0], a.y - webs[0].hub[1]]; if (b.mode === 'skitter') bTo = [b.x - webs[1].hub[0], b.y - webs[1].hub[1]]; }
  assert.ok(aGo > 0 && bGo > 0 && Math.abs(aGo - bGo) > 0.03, `their own reaction times: ${(aGo - t1).toFixed(2)} s vs ${(bGo - t1).toFixed(2)} s`);
  assert.ok(aTo && bTo && Math.hypot(aTo[0] - bTo[0], aTo[1] - bTo[1]) > 6, `their own dashes: ${aTo.map(v => v.toFixed(0))} vs ${bTo.map(v => v.toFixed(0))}`);
});
