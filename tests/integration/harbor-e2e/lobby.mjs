// CITY 2.0 — THE HARBOR end to end: LOBBY 2.0 A (Nov 3 — docs/harbor/passes/lobby-2a.md). `billboard`: THE ANNOUNCEMENT BILLBOARD's
// cross-fade (the owner: his message "snaps on"). More groups of this pass join here (the room in the city, the dock, the guest list…).
// ADDING A GROUP: G('name', …) in its job's file + the name in ../harbor-jobs.mjs (CI_JOBS).
import { log, sleep, ok, okT, NIGHT, open, ev, waitFor, harborUp, G } from './kit.mjs';

const RM = { fn: () => { const mm = window.matchMedia.bind(window); window.matchMedia = q => (/prefers-reduced-motion/.test(q) ? { matches: true, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} } : mm(q)); }, arg: null };

G('billboard', async () => {
  // a fresh load MID-MESSAGE (a link's &force=billboard-hints keeps the hint up): the message is simply there — nothing fades
  { const Q = await open({ slot: 'bx0', qs: `${NIGHT}&wx=clear&force=billboard-hints&hint=fireworks`, view: [402, 874] }), p = Q.page;
    await harborUp(p); await sleep(4000);
    const x = await ev(p, 'window.__district.boardXf()');
    ok(x && x.n === 0, `THE BILLBOARD — a fresh load mid-message: the message is simply there, no fade (${x && x.n} fades)`);
    await Q.ctx.close(); }
  // the panel's JUST ME switch (the same path as the owner's message on the board): the game → the hint at once, then the hint → the game
  const run = async (slot, rm, dpr = 0) => {
    const Q = await open({ slot, qs: `${NIGHT}&wx=clear&hint=fireworks`, view: [402, 874], dpr, init: rm ? RM : null }), p = Q.page;
    await harborUp(p); await sleep(2500);
    await waitFor(p, '!!window.__district.remote()', 'the panel', 10000);
    const n0 = (await ev(p, 'window.__district.boardXf()')).n;
    await ev(p, "window.__district.remote().setMine({ force: ['billboard-hints'] })");
    await waitFor(p, `window.__district.boardXf().n > ${n0}`, 'the board swaps (the game → the hint)', 8000);
    const xs = [];
    for (let i = 0; i < 16; i++) { xs.push(await ev(p, '(() => { const x = window.__district.boardXf(); return { a: x.a, t: performance.now() }; })()')); await sleep(70); }
    const x1 = await ev(p, 'window.__district.boardXf()');
    await Q.ctx.close();
    return { xs, x1 };
  };
  { const { xs, x1 } = await run('bx', false);
    const first = xs.find(s => s.a > 0), lastOn = [...xs].reverse().find(s => s.a > 0), mono = xs.every((s, i) => i === 0 || s.a <= xs[i - 1].a + 0.001);
    ok(x1.ms === 900 && first && first.a > 0.4 && mono && xs[xs.length - 1].a === 0, `THE BILLBOARD CROSS-FADES (the day's game → the message): the old board's copy fades out over ${x1.ms} ms on the ${x1.layer} layer — ${xs.map(s => s.a.toFixed(2)).join(' ')}`);
    okT(lastOn && first && lastOn.t - first.t < 1100, `the fade ends within ~0.9 s (${lastOn && first ? Math.round(lastOn.t - first.t) : '—'} ms of it seen)`); }
  { const { xs, x1 } = await run('bx3', false, 3);
    ok(x1.layer === 'crisp' && xs.some(s => s.a > 0.3) && xs[xs.length - 1].a === 0, `THE BILLBOARD at 3× (an iPhone): the fade on the CRISP layer (${x1.layer}) — ${xs.map(s => s.a.toFixed(2)).join(' ')}`); }
  { const { xs, x1 } = await run('bxr', true);
    ok(x1.ms === 250 && xs[xs.length - 1].a === 0, `THE BILLBOARD — reduced motion: a quick plain fade (${x1.ms} ms)`); }
  log('billboard', 'done');
});
