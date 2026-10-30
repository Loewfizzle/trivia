// CITY 2.0 — THE HARBOR, C4c: THE PHONE BENCH (`?city=2&bench=1` — the owner, Oct 28: "are we too careful anywhere else?"). Every budget
// + threshold so far was tuned on the laptop at 4× CPU ("relative only" — review-4), while the owner's iPhone showed 1–3 ms of work at
// tier 1: the PHONE may have far more headroom. The bench plays the heaviest scenes and records each one's frame times, the work per frame,
// the tier (+ every step down / up and why), the canvas memory (the honest total: canvas-safe.js#canvasMb) and the memory guard's verdict.
// At the end THE REPORT shows ON SCREEN with a COPY button AND goes to /admin's "Reports from phones" as kind 'bench'. Never runs without
// the flag; never starts without a tap (START). Lazy: imported only under `&bench=1`.
//
// SKY-B — THE BENCH TELLS THE TRUTH (the owner, Oct 30 12:39 pm: the bench said the party ran at 19.5 fps where a direct &debug=1 visit on a
// cooled phone said 51 — it ran right after a long session, its first scenes still baking, every scene stacked on the last one's canvases):
//   · EVERY SCENE ON A FRESH PAGE — exactly a direct visit: the bench saves its run in sessionStorage and LOADS the scene's link (the previous
//     scene's page, canvases + caches released with it), then: the city's BAKES FINISHED first (the bakes, the crossfade, the neon's sprite
//     queue — at most 30 s), a COOL-DOWN with the city paused (8 s: the phone sheds the last scene's heat), the scene's own SETTLE, then the
//     measured window.
//   · THE FRAME SIDE, not only the JS: per scene the frame times next to the city's own JS work → "outside the JS" (frame p50 − work p50: the
//     GPU process rasterizing the canvases + the compositor — on the owner's iPhone the party's JS was ~10 ms while its frames took 18–24),
//     the pixels the city paints a frame (MP + how many screens of it: counted over 1.5 s AFTER the measured window — the counting costs JS)
//     with its draw calls + paths, and the page's composited canvases.
//   · THE PHONE's STATE: a CPU SPEED index (a fixed JS workload, timed before + after every scene: a warm, throttled phone shows it falling),
//     the screen's idle frame rate while paused (≈ 30 fps = LOW POWER MODE; ≈ 120 = ProMotion), the battery when the browser tells.
//   · WHAT COSTS THE PARTY (THE PROFILE): the same dance break with ONE piece off at a time, the tier pinned at 2 — the crowd, the street
//     party's crowd, the wands, the crisp 3× layers, the sky beams, the live water, the vignette back on the canvas — each row's frame time
//     against the full break's: the phone itself says where its frame goes.
// docs/harbor/passes/c4c.md + sky-b.md · docs/testing.md (ONLY=bench).

/** the scenes, in order (each a preview state as URL flags) */
export const BENCH_SCENES = Object.freeze([
  { id: 'party', label: 'a party peak (Sat 11 pm)', q: { when: '2026-10-24T23:00', wx: 'clear' } },
  // (NIGHT-B: THE STREET PARTY's heaviest moment — Sat Oct 24's conga break: the pockets bouncing, the 20-strong conga, the spill in the
  // street, the bench dancers; SKY-B: the break helicopter is OFF by default — &force=break-heli)
  { id: 'party-break', label: 'a dance break: the conga + the spill (Sat 10:06 pm)', q: { when: '2026-10-24T22:06:20', wx: 'clear' } },
  { id: 'party-snow', label: 'a party in snow (Sat Jan 16, 11 pm)', q: { when: '2027-01-16T23:00', wx: 'snow' } },
  { id: 'halloween', label: "Halloween's props night (Oct 31, 9 pm)", q: { when: '2026-10-31T21:00', wx: 'clear' } },
  { id: 'ufo', label: 'the UFO over a crowd (Sat 10 pm)', q: { when: '2026-10-24T22:00', wx: 'clear' }, legend: 'ufo' },
  // (SKY-A: the TR-3B at full res + its lights on the world, the F-22 vic on the model, THE BLACKBIRD passing them)
  { id: 'tr3b', label: "the TR-3B's drain + the F-22 chase + the Blackbird", q: { when: '2026-10-21T22:00', wx: 'clear' }, legend: 'tr3b', measure: 30000 },
  { id: 'blackbird', label: 'THE BLACKBIRD (a forced flyby every ~8 s)', q: { when: '2026-10-21T22:00', wx: 'clear', force: 'blackbird' } },
  { id: 'storm', label: 'a summer storm (9:30 pm)', q: { when: '2026-07-11T21:30', wx: 'storm' } },
]);
/** SKY-B — THE PROFILE: the dance break with one piece off at a time (the tier pinned at 2) — what each costs on this phone */
export const BENCH_PROFILE = Object.freeze([
  { id: 'p-full', label: 'the dance break, everything on', off: '' },
  { id: 'p-people', label: '… without ANY people', off: 'no-people' },
  { id: 'p-crowd', label: '… without the street party (walkers stay)', off: 'no-street-party' },
  { id: 'p-wands', label: '… without the wands + their trails', off: 'no-wands' },
  { id: 'p-crisp', label: '… without the crisp 3× layers', off: 'no-crisp' },
  { id: 'p-beams', label: '… without the sky beams', off: 'no-beams' },
  { id: 'p-water', label: '… without the live water', off: 'no-water' },
  { id: 'p-vig', label: '… the vignette back ON THE CANVAS (the old way)', off: 'vig-canvas' },
]);
export const PROFILE_Q = Object.freeze({ when: '2026-10-24T22:06:20', wx: 'clear' });
export const BENCH = Object.freeze({ cool: 8000, settle: 5000, measure: 15000, profile: 10000, readyMax: 30000, fill: 1500 });
const KEY = 'na:bench2';

const q = (a, p) => { if (!a.length) return 0; const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(s.length * p))]; };
const mean = a => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
/** PURE: one scene's numbers from its frames (dt ms) + work (ms) → the report's row values (side = frame p50 − work p50: outside the JS) */
export function benchStats(dts, works) {
  const dur = dts.reduce((x, y) => x + y, 0);
  const p50 = +q(dts, 0.5).toFixed(1), w50 = +q(works, 0.5).toFixed(1);
  return {
    n: dts.length, fps: dur > 0 ? +(1000 * dts.length / dur).toFixed(1) : 0,
    p50, p95: +q(dts, 0.95).toFixed(1), worst: +(dts.length ? Math.max(...dts) : 0).toFixed(1),
    slow: dts.length ? Math.round(100 * dts.filter(v => v > 20).length / dts.length) : 0,
    work: +mean(works).toFixed(1), workP95: +q(works, 0.95).toFixed(1),
    side: dts.length ? +Math.max(0, p50 - w50).toFixed(1) : 0,
  };
}

/** PURE: the link a bench step loads — the page's own flags (debug, tz, at, dpr…) + the step's state (when, wx, force) + the bench's */
export function benchUrl(base, step, fast) {
  const u = new URL(base);
  const p = u.searchParams;
  for (const k of ['when', 'wx', 'force', 'bench', 'benchfast', 'benchrun', 'lgnow', 'lgs']) p.delete(k);
  p.set('city', '2');
  if (!p.has('tz')) p.set('tz', 'America/Detroit');
  if (!p.has('at')) p.set('at', '42.96,-85.67');
  for (const [k, v] of Object.entries(step.q || {})) if (v != null && v !== '' && k !== 'force') p.set(k, v);
  const force = [step.q && step.q.force, step.off].filter(Boolean).join(',');
  if (force) p.set('force', force);
  p.set('bench', '1'); p.set('benchrun', '1');
  if (fast) p.set('benchfast', '1');
  return u.toString();
}

/** a fixed JS workload's time (ms, the best of 3) — the CPU's speed now: a warm phone slows it */
export function cpuProbe() {
  let best = Infinity, x = 0;
  for (let r = 0; r < 3; r++) {
    const t0 = performance.now();
    for (let i = 1; i < 400000; i++) x += Math.sqrt(i) * Math.sin(i * 0.001);
    best = Math.min(best, performance.now() - t0);
  }
  if (x === 42) console.log(x);   // (keeps the loop from being optimized away)
  return best;
}

/** PURE: the report's text (rows: [{ scene, stats, tier0, tier1, mem, steps, why, fill?, cpu?, profile?, id? }], head: { ua, w, h, dpr, cityDpr, cap, at }) */
export function benchText(head, rows, extra = {}) {
  const pad = (s, n) => String(s).padEnd(n);
  const L = [
    'NEON SPEAKEASY — THE PHONE BENCH (C4c + SKY-B, City 2.0)',
    `${head.at} · ${head.w}×${head.h} pt · device dpr ${head.dpr} · the city at ${head.cityDpr}×${head.cap > 2 ? ' (&dpr=3)' : ''} · ${head.ua}`,
    `each scene on a FRESH PAGE: its bakes finished, ${BENCH.cool / 1000} s cool-down (the city paused), ${BENCH.settle / 1000} s to settle, then ${BENCH.measure / 1000} s measured. frames = the time between frames (16.7 = 60 fps); work = the city's own JS per frame; outside = frame p50 − work p50 (the GPU process rasterizing + the compositor); slow = frames over 20 ms`,
  ];
  if (extra.phone) L.push(`the phone: ${extra.phone}`);
  L.push('', `${pad('scene', 38)} ${pad('fps', 6)} ${pad('frames p50/p95/worst ms', 25)} ${pad('slow', 6)} ${pad('work mean/p95', 15)} ${pad('outside', 8)} ${pad('tier', 10)} canvases MB`);
  const row = r => {
    const s = r.stats;
    L.push(`${pad(r.scene, 38)} ${pad(s.fps, 6)} ${pad(`${s.p50} / ${s.p95} / ${s.worst}`, 25)} ${pad(`${s.slow}%`, 6)} ${pad(`${s.work} / ${s.workP95}`, 15)} ${pad(s.side != null ? s.side : '—', 8)} ${pad(`${r.tier0}→${r.tier1}`, 10)} ${r.mem}`);
    if (r.fill) L.push(`    painted a frame: ${r.fill.mp} MP (${r.fill.screens} screens) · ${r.fill.calls} draws + ${r.fill.paths} paths · on the page: ${r.fill.layers} canvases, ${r.fill.layerMp} MP`);
    if (r.cpu) L.push(`    CPU speed ${r.cpu}`);
    if (r.steps && r.steps.length) for (const st of r.steps) L.push(`    ${st.dir === 'down' ? '↓' : st.dir === 'up' ? '↑' : '·'} ${st.at} s: ${st.text}`);
    if (r.why) L.push(`    mostly at 60 because: ${r.why}`);
  };
  for (const r of rows.filter(r => !r.profile)) row(r);
  const prof = rows.filter(r => r.profile);
  if (prof.length) {
    const full = prof.find(r => r.id === 'p-full');
    L.push('', `WHAT COSTS THE PARTY (the dance break, the tier pinned at 2; ${BENCH.profile / 1000} s each on a fresh page) — vs everything on:`);
    for (const r of prof) {
      row(r);
      if (full && r !== full) { const d = +(r.stats.p50 - full.stats.p50).toFixed(1), dw = +(r.stats.work - full.stats.work).toFixed(1), ds = r.stats.slow - full.stats.slow; L.push(`    → frame p50 ${d > 0 ? '+' : ''}${d} ms · work ${dw > 0 ? '+' : ''}${dw} ms · slow ${ds > 0 ? '+' : ''}${ds} %`); }
    }
  }
  L.push('');
  if (extra.guard) L.push(`memory guard: ${extra.guard}`);
  if (extra.tierLog && extra.tierLog.length) { L.push('every quality step this visit:'); for (const st of extra.tierLog.slice(-20)) L.push(`  ${st.at} s ${st.dir}: ${st.text}`); }
  if (extra.note) L.push(extra.note);
  return L.join('\n');
}

/**
 * o: { legend(kind) — start a legendary now, hold(on) — the panel's re-apply held off while it runs, hook(fn | null) — fn(dt ms, work ms)
 * every frame, snap() → { tier, dprTier, dpr, W, H, mem, tierLog, fast }, ready() → the city shown + its bakes, crossfades + neon sprites
 * done, pause(on) — the city's frames skipped (the cool-down), pin(tier | null), send(text) → Promise<bool>, fast, running (this page was
 * loaded by a bench step: &benchrun=1), go(url) (default location.replace) }
 */
export function createBench(o) {
  // (&benchfast=1 — the tests: every window 10× shorter)
  const K = o.fast ? 0.1 : 1;
  const ss = (() => { try { return window.sessionStorage; } catch { return null; } })();
  const load = () => { try { return JSON.parse((ss && ss.getItem(KEY)) || 'null'); } catch { return null; } };
  const save = v => { try { if (v) ss.setItem(KEY, JSON.stringify(v)); else ss.removeItem(KEY); } catch { /* private mode: one page only */ } };
  const st = { running: false, done: false, i: -1, report: '', sent: null, rows: 0 };
  let run = load(), el = null, statusEl = null, timer = 0, destroyed = false, cur = null;
  const css = (n, s) => { for (const k in s) n.style[k] = s[k]; return n; };
  const mk = (tag, s, text) => { const n = document.createElement(tag); if (s) css(n, s); if (text != null) n.textContent = text; return n; };
  const btn = (label, on) => { const b = mk('button', { font: '600 15px "Chakra Petch", system-ui, sans-serif', letterSpacing: '0.08em', color: '#fff', background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.45)', borderRadius: '22px', minHeight: '44px', padding: '0 18px', margin: '6px 6px 0 0', cursor: 'pointer' }, label); b.type = 'button'; b.addEventListener('click', on); return b; };
  function card(small = false) {
    if (el) el.remove();
    // (while it measures: a small pill under the corner buttons — the big glass card would be part of what the phone composites)
    el = mk('div', small ? { position: 'fixed', left: '12px', top: 'calc(env(safe-area-inset-top, 0px) + 58px)', zIndex: '90', padding: '6px 10px', borderRadius: '12px', background: 'rgba(10,8,22,0.8)', color: '#f2eef8', font: '12px "Chakra Petch", system-ui, sans-serif', maxWidth: '78vw' }
      : { position: 'fixed', left: '12px', right: '12px', top: 'calc(env(safe-area-inset-top, 0px) + 64px)', zIndex: '90', maxWidth: '560px', margin: '0 auto', padding: '14px 16px', borderRadius: '16px',
        background: 'rgba(10,8,22,0.86)', border: '1px solid rgba(255,255,255,0.28)', color: '#f2eef8', font: '14px "Chakra Petch", system-ui, sans-serif', boxShadow: '0 8px 30px rgba(0,0,0,0.5)' });
    el.className = 'hb-bench';
    if (!small) el.append(mk('div', { font: '700 16px "Orbitron", system-ui, sans-serif', letterSpacing: '0.12em', marginBottom: '6px' }, 'THE PHONE BENCH'));
    statusEl = mk(small ? 'span' : 'div', { lineHeight: '1.4', color: '#d9d2e6' });
    el.append(statusEl);
    document.body.append(el);
    return el;
  }
  const planOf = which => [...(which === 'profile' ? [] : BENCH_SCENES.map(s => ({ kind: 'scene', id: s.id }))), ...(which === 'scenes' ? [] : BENCH_PROFILE.map(p => ({ kind: 'profile', id: p.id })))];
  const stepOf = s => (s.kind === 'scene' ? BENCH_SCENES.find(x => x.id === s.id) : { ...BENCH_PROFILE.find(x => x.id === s.id), q: PROFILE_Q, measure: BENCH.profile });
  const minutes = plan => Math.round(plan.reduce((a, s) => a + 12000 + BENCH.cool + BENCH.settle + (stepOf(s).measure || BENCH.measure) + BENCH.fill, 0) / 6000) / 10;
  function idle() {
    card();
    statusEl.textContent = `${BENCH_SCENES.length} heavy scenes (~${minutes(planOf('scenes'))} min) + WHAT COSTS THE PARTY (${BENCH_PROFILE.length} rows, ~${minutes(planOf('profile'))} min) — each on a fresh page. A cool phone, ON THE CHARGER, nothing else open, the screen on, this page in front. The report shows here at the end + goes to /admin.`;
    el.append(btn('START', () => start('all')), btn('SCENES', () => start('scenes')), btn('PROFILE', () => start('profile')), btn('CLOSE', close));
  }
  function start(which = 'all') {
    if (st.running) return;
    const plan = planOf(which);
    run = { v: 2, base: location.href, plan, i: 0, rows: [], startedAt: Date.now(), cpu0: +cpuProbe().toFixed(2), phone: [], fast: !!o.fast };
    save(run);
    const go1 = () => go(run.plan[0]);
    if (navigator.getBattery) navigator.getBattery().then(b => { run.phone.push(`battery ${Math.round(b.level * 100)} %${b.charging ? ', charging' : ', NOT charging'}`); save(run); go1(); }, go1);
    else go1();
  }
  function go(s) {
    st.running = true;
    const url = benchUrl(run.base, stepOf(s), run.fast);
    if (o.go) o.go(url); else location.replace(url);
  }
  // ---- a step on its fresh page
  function resume() {
    const s = run.plan[run.i], sc = s && stepOf(s);
    if (!sc) { finish(); return; }
    st.running = true; st.i = run.i;
    o.hold(true);
    card(true);
    const stop = btn('STOP', () => finish('stopped by a tap')); css(stop, { minHeight: '30px', padding: '0 10px', fontSize: '12px', margin: '0 0 0 8px' });
    el.append(stop);
    if (s.kind === 'profile') o.pin(2);
    cur = { s, sc, dts: [], works: [], phase: 'ready', t0: performance.now(), tier0: null, steps0: (o.snap().tierLog || []).length, fast: new Map(), memMax: 0, idle: [] };
    o.hook((dt, work) => {
      if (!cur) return;
      if (cur.phase === 'measure') { cur.dts.push(dt); cur.works.push(work); const f = o.snap().fast || 'calm'; cur.fast.set(f, (cur.fast.get(f) || 0) + 1); }
    });
    tick();
  }
  const SET = () => BENCH.settle * K, COOL = () => BENCH.cool * K, MEAS = () => (cur.sc.measure || BENCH.measure) * K, FILL = () => Math.max(300, BENCH.fill * K);
  function idleRate() {
    // (the screen's own rate while the city is paused: rAF intervals over ~1 s)
    const ts = [];
    const f = t => { ts.push(t); if (ts.length < 70 && cur && cur.phase === 'cool') requestAnimationFrame(f); else if (cur) cur.idle = ts.slice(1).map((t2, i) => t2 - ts[i]); };
    requestAnimationFrame(f);
  }
  function tick() {
    if (destroyed || !cur) return;
    const now = performance.now(), e = now - cur.t0;
    if (cur.phase === 'ready' && (o.ready() || e > BENCH.readyMax)) { cur.readyMs = Math.round(e); cur.phase = 'cool'; cur.t0 = now; o.pause(true); idleRate(); }
    else if (cur.phase === 'cool' && e >= COOL()) { o.pause(false); cur.cpuA = cpuProbe(); cur.phase = 'settle'; cur.t0 = now; if (cur.sc.legend && o.legend) o.legend(cur.sc.legend); }
    else if (cur.phase === 'settle' && e >= SET()) { cur.phase = 'measure'; cur.t0 = now; const s = o.snap(); cur.tier0 = `${s.tier}/${s.dprTier}`; }
    else if (cur.phase === 'measure') {
      const s = o.snap(); cur.memMax = Math.max(cur.memMax, (s.mem && s.mem.tracked) || 0);
      if (e >= MEAS()) { cur.phase = 'fill'; cur.t0 = now; cur.fill = countFill(); }
    } else if (cur.phase === 'fill' && e >= FILL()) { stepDone(); return; }
    const left = { ready: BENCH.readyMax - e, cool: COOL() - e, settle: SET() - e, measure: MEAS() - e, fill: FILL() - e }[cur.phase] || 0;
    statusEl.textContent = `BENCH ${run.i + 1}/${run.plan.length} · ${cur.sc.label} · ${{ ready: 'baking', cool: 'cooling (paused)', settle: 'settling', measure: 'MEASURING', fill: 'counting' }[cur.phase]} ${Math.max(0, Math.ceil(left / 1000))} s`;
    timer = setTimeout(tick, 250);
  }
  // (the pixels the city paints a frame: every 2D draw into a canvas ON THE PAGE, its device-pixel area — wrapped for the window only)
  function countFill() {
    const P = CanvasRenderingContext2D.prototype, keep = { drawImage: P.drawImage, fillRect: P.fillRect, fill: P.fill, stroke: P.stroke };
    const S = { mp: 0, calls: 0, paths: 0, frames: 0 };
    const area = (x, w, h) => { const m = x.getTransform(); return Math.abs(w * h * (m.a * m.d - m.b * m.c)); };
    P.drawImage = function (img, ...a) { if (this.canvas.isConnected) { const w = a.length === 2 ? img.width : a.length === 4 ? a[2] : a[6], h = a.length === 2 ? img.height : a.length === 4 ? a[3] : a[7]; S.mp += area(this, w || 0, h || 0); S.calls++; } return keep.drawImage.call(this, img, ...a); };
    P.fillRect = function (x, y, w, h) { if (this.canvas.isConnected) { S.mp += area(this, w, h); S.calls++; } return keep.fillRect.call(this, x, y, w, h); };
    P.fill = function (...a) { if (this.canvas.isConnected) S.paths++; return keep.fill.apply(this, a); };
    P.stroke = function (...a) { if (this.canvas.isConnected) S.paths++; return keep.stroke.apply(this, a); };
    let raf = 0; const f = () => { S.frames++; raf = requestAnimationFrame(f); }; raf = requestAnimationFrame(f);
    return { done() {
      cancelAnimationFrame(raf); Object.assign(P, keep);
      const F = Math.max(1, S.frames), main = document.querySelector('.nd-scene canvas') || {}, screen = Math.max(1, (main.width || 1) * (main.height || 1));
      const layers = [...document.querySelectorAll('canvas')].filter(c => c.isConnected && c.width > 1 && c.style.display !== 'none' && c.offsetParent !== null);
      return { mp: +(S.mp / F / 1e6).toFixed(2), screens: +(S.mp / F / screen).toFixed(1), calls: Math.round(S.calls / F), paths: Math.round(S.paths / F), layers: layers.length, layerMp: +(layers.reduce((a, c) => a + c.width * c.height, 0) / 1e6).toFixed(2) };
    } };
  }
  function stepDone() {
    const s = o.snap(), log = s.tierLog || [], c = cur;
    const fill = c.fill ? c.fill.done() : null;
    o.hook(null); cur = null; clearTimeout(timer);
    const cpuB = cpuProbe(), base = run.cpu0 || cpuB;
    const fast = [...c.fast.entries()].sort((a, b) => b[1] - a[1]).slice(0, 2).map(([k, n]) => `${k} ${Math.round(100 * n / Math.max(1, c.dts.length))}%`).join(', ');
    if (run.rows.length === 0 && c.idle.length > 10) { const m = q(c.idle, 0.5); run.phone.push(`the screen's idle rate ${(1000 / m).toFixed(0)} fps${m > 25 ? ' — LOW POWER MODE likely ON (Safari caps it at 30)' : m < 12 ? ' (120 Hz)' : ''}`); }
    run.rows.push({ id: c.s.id, profile: c.s.kind === 'profile', scene: c.sc.label, stats: benchStats(c.dts, c.works), tier0: c.tier0, tier1: `${s.tier}/${s.dprTier}`, mem: c.memMax.toFixed(1), steps: log.slice(c.steps0), why: fast, fill,
      cpu: `${Math.round(100 * base / Math.max(0.01, c.cpuA || cpuB))} % → ${Math.round(100 * base / Math.max(0.01, cpuB))} % of the start's (a falling % = a warm phone throttling)`, ready: c.readyMs });
    run.i++;
    save(run);
    if (run.i >= run.plan.length) { finish(); return; }
    go(run.plan[run.i]);
  }
  function finish(why = '') {
    clearTimeout(timer); o.hook(null); cur = null;
    try { o.pause(false); o.pin(null); } catch { /* polish */ }
    o.hold(false);
    st.running = false; st.done = true;
    const r = run || { rows: [], phone: [] };
    const s = o.snap(), g = s.mem && s.mem.guard;
    const head = { at: new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC', ua: navigator.userAgent, w: Math.round(innerWidth), h: Math.round(innerHeight), dpr: window.devicePixelRatio || 1, cityDpr: s.dpr, cap: s.cap || 2 };
    st.report = benchText(head, r.rows, { phone: (r.phone || []).join(' · '), guard: (g ? (g.stepped.length ? `STEPPED DOWN ${g.stepped.map(x => `${x.name} ${x.from}→${x.to}`).join(', ')}` : `nothing stepped down at the last layout (the bakes want ${g.want} MB + ${g.others} MB else live, of a ${g.budget} MB budget)`) : '—') + (s.mem ? ` · every live canvas now ${s.mem.tracked} MB (${s.mem.canvases})` : ''), tierLog: s.tierLog, note: [why ? `(${why})` : '', o.fast ? '(&benchfast=1: a test run — 10× shorter windows)' : ''].filter(Boolean).join(' ') });
    st.rows = r.rows.length;
    save(null); run = null;
    card();
    statusEl.textContent = st.rows ? 'Done. The report:' : 'Stopped.';
    const ta = mk('textarea', { width: '100%', height: '42vh', marginTop: '8px', font: '11px/1.35 "JetBrains Mono", ui-monospace, monospace', color: '#e8e4f0', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', padding: '8px', boxSizing: 'border-box', whiteSpace: 'pre' });
    ta.readOnly = true; ta.value = st.report;
    el.append(ta);
    const sentEl = mk('div', { marginTop: '6px', color: '#c8bfda' }, 'Sending to /admin …');
    el.append(btn('COPY', () => copy(ta)), btn('RUN AGAIN', () => { if (el) el.remove(); st.done = false; idle(); }), btn('CLOSE', close), sentEl);
    if (st.rows) o.send(st.report).then(ok => { st.sent = ok; sentEl.textContent = ok ? 'Saved to /admin → Reports from phones ✓' : 'Not saved to /admin (offline, or the hourly limit) — COPY it instead.'; });
    else sentEl.textContent = '';
  }
  function copy(ta) {
    const done = ok => { const b = [...el.querySelectorAll('button')].find(x => x.textContent.startsWith('COPY')); if (b) b.textContent = ok ? 'COPIED ✓' : 'SELECT + COPY'; };
    try { if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(ta.value).then(() => done(true), () => { ta.select(); done(document.execCommand && document.execCommand('copy')); }); return; } } catch { /* fall through */ }
    ta.focus(); ta.select(); try { done(document.execCommand('copy')); } catch { done(false); }
  }
  function close() { if (st.running) finish('closed'); if (el) el.remove(); el = null; }
  // (a run in progress + this page loaded by its step (&benchrun=1) → this page IS the next step; else the START card)
  if (run && run.v === 2 && o.running) resume();
  else { if (run) save(null); run = null; idle(); }
  return {
    start, stop: () => finish('stopped'), close,
    state: () => ({ running: st.running, done: st.done, i: run ? run.i : st.i, scene: cur ? cur.s.id : null, phase: cur ? cur.phase : '', rows: run ? run.rows.length : st.rows, sent: st.sent, report: st.report }),
    destroy() { destroyed = true; clearTimeout(timer); try { o.hook(null); o.hold(false); o.pause(false); } catch { /* */ } if (el) el.remove(); el = null; },
  };
}
