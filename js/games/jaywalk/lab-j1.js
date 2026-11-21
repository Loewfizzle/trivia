// JAYWALK J1 — THE LAB's LOOK CHECKS for the owner's phone (jaywalk-lab.html — zero server calls; lazy, only with `?j1=`):
//   ?j1=splits   — a solo end card with YOUR SPLITS (4 boxes; the server's answer lands a moment later: one NEW BEST · −0:04)
//   ?j1=splits9  — a long run's row (9 splits: it scrolls sideways, a box never shrinks)
//   ?j1=moments  — THE MATCH MOMENTS over the scene, on a loop: MIA IS OUT (+ the red X) → LIAM out = HEAD TO HEAD + the siren + the red
//                  edges → THE DUEL STRIP → JO out = LAST ONE STANDING (the sounds after the first tap — the audio unlock)
// The real builders (victory.js#buildEnd · splits-card.js · moments-view.js) — the same pieces the game draws; sample numbers only.
import { h } from '../../ui/dom.js';
import { buildEnd } from './victory.js';
import { splitsCard } from './splits-card.js';
import { createMomentsView } from './moments-view.js';

const COLORS = { YOU: '#00f0ff', MIA: '#ff2bd6', LIAM: '#f3ff3a', JO: '#3dff8b' };

export function mountJ1(stage, { what, sfx }) {
  setTimeout(() => { document.body.dataset.ready = '1'; }, 1500);   // (the look shots' own wait — tests/integration/shots.mjs --page)
  if (what === 'splits' || what === 'splits9') {
    const long = what === 'splits9', ticks = long ? [1890, 4120, 6480, 8730, 11020, 13390, 15700, 18100, 20450] : [1980, 4300, 6540, 9020];
    const body = h('div.final-body.jw-fin', { 'data-mode': 'solo' });
    const B = buildEnd(body, { line: 'FLATTENED BY A BOX TRUCK', lanes: long ? 463 : 212 });
    B.best(`YOUR BEST · ${long ? 463 : 238}`);
    const SC = splitsCard(ticks);
    body.append(SC.el);
    const card = h('div.jw-final.jw-local', h('div.jw-local-in', h('div.jw-j1-k', 'J1 LOOK CHECK · YOUR SPLITS · SAMPLE NUMBERS'), body));
    stage.append(card);
    // (the server's answer, a moment later: one split faster than the best = NEW BEST + the gain; the rest show the best under them)
    setTimeout(() => SC.server({ r: ticks, b: ticks.map((t, i) => (i === 1 ? t : t - 60 * (i + 1))), n: [{ i: 1, at: 100, tick: ticks[1], prev: ticks[1] + 240 }] }), 900);
    return;
  }
  if (what !== 'moments') return;
  const M = createMomentsView(stage, { nameOf: u => u, colorOf: u => COLORS[u] || '#fff', sound: id => { const S = sfx(); if (S) { try { S.play(id); } catch { /* silent */ } } } });
  const S0 = sfx(); if (S0 && S0.MATCH_SOUNDS) S0.fetchSounds(S0.MATCH_SOUNDS);
  let sw = stage.clientWidth || 390, sh = stage.clientHeight || 844;   // (read once + on a resize — never in the frame)
  addEventListener('resize', () => { sw = stage.clientWidth || sw; sh = stage.clientHeight || sh; });
  const ids = ['YOU', 'MIA', 'LIAM', 'JO'], W = () => sw, H = () => sh;
  let t0 = performance.now(), ends = {}, raf = 0, pumpAt = 0;
  const lanes = t => ({ YOU: 60 + Math.floor(t / 400), MIA: 87, LIAM: 90 + (t > 4000 ? 0 : Math.floor(t / 500)), JO: 55 + Math.floor(Math.min(t, 10000) / 420) });
  const ghostAt = u => (ends[u] ? [W() * (u === 'MIA' ? 0.3 : u === 'LIAM' ? 0.68 : 0.5), H() * 0.5, 44] : null);
  function frame(now) {
    raf = requestAnimationFrame(frame);
    if (!stage.isConnected) { cancelAnimationFrame(raf); return; }
    const t = now - t0;
    if (t > 15000) { t0 = now; ends = {}; M.reset(); return; }
    const L = lanes(t);
    if (t > 1200 && !ends.MIA) ends.MIA = { l: 87, w: 'car' };
    if (t > 4500 && !ends.LIAM) ends.LIAM = { l: L.LIAM, w: 'water' };
    if (t > 10500 && !ends.JO) ends.JO = { l: L.JO, w: 'train' };
    if (now - pumpAt > 100) { pumpAt = now; M.pump({ ids, me: 'YOU', ends: { MIA: ends.MIA || null, LIAM: ends.LIAM || null, JO: ends.JO || null }, mine: null, lanes: L }); }
    M.frame(now, ghostAt);
  }
  raf = requestAnimationFrame(frame);
}
