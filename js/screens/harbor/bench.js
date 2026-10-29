// CITY 2.0 — THE HARBOR, C4c: THE PHONE BENCH (`?city=2&bench=1` — the owner, Oct 28: "are we too careful anywhere else?"). Every budget
// + threshold so far was tuned on the laptop at 4× CPU ("relative only" — review-4), while the owner's iPhone showed 1–3 ms of work at
// tier 1: the PHONE may have far more headroom. The bench plays the heaviest scenes ~20 s each through the preview panel's own switch
// (scene.js#applyRemote) — a party peak, a party in snow, Halloween's props night, the UFO over a crowd, the TR-3B's drain + the chase, a
// storm — and records each one's frame times, the work per frame, the tier (+ every step down / up and why), the canvas memory (the
// honest total: canvas-safe.js#canvasMb) and the memory guard's verdict. At the end THE REPORT shows ON SCREEN with a COPY button (the
// owner pastes it into the next pass) AND goes to /admin's "Reports from phones" as kind 'bench' (a friend's older phone's run lands
// there too). Never runs without the flag; never starts without a tap (START). Lazy: imported only under `&bench=1`.
// docs/harbor/passes/c4c.md (what it measures, the memory guard's table) · docs/testing.md (ONLY=bench, MEASURE=1).

/** the scenes, in order (each a preview state: the panel's REMOTE_KEYS) */
export const BENCH_SCENES = Object.freeze([
  { id: 'party', label: 'a party peak (Sat 11 pm)', q: { when: '2026-10-24T23:00', wx: 'clear' } },
  { id: 'party-snow', label: 'a party in snow (Sat Jan 16, 11 pm)', q: { when: '2027-01-16T23:00', wx: 'snow' } },
  { id: 'halloween', label: "Halloween's props night (Oct 31, 9 pm)", q: { when: '2026-10-31T21:00', wx: 'clear' } },
  { id: 'ufo', label: 'the UFO over a crowd (Sat 10 pm)', q: { when: '2026-10-24T22:00', wx: 'clear' }, legend: 'ufo' },
  { id: 'tr3b', label: "the TR-3B's drain + the chase", q: { when: '2026-10-21T22:00', wx: 'clear' }, legend: 'tr3b', measure: 40000 },
  { id: 'storm', label: 'a summer storm (9:30 pm)', q: { when: '2026-07-11T21:30', wx: 'storm' } },
]);
export const BENCH = Object.freeze({ settle: 6000, measure: 20000 });

/** PURE: one scene's numbers from its frames (dt ms) + work (ms) → the report's row values */
export function benchStats(dts, works) {
  const q = (a, p) => { if (!a.length) return 0; const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(s.length * p))]; };
  const mean = a => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
  const dur = dts.reduce((x, y) => x + y, 0);
  return {
    n: dts.length, fps: dur > 0 ? +(1000 * dts.length / dur).toFixed(1) : 0,
    p50: +q(dts, 0.5).toFixed(1), p95: +q(dts, 0.95).toFixed(1), worst: +(dts.length ? Math.max(...dts) : 0).toFixed(1),
    slow: dts.length ? Math.round(100 * dts.filter(v => v > 20).length / dts.length) : 0,
    work: +mean(works).toFixed(1), workP95: +q(works, 0.95).toFixed(1),
  };
}

/** PURE: the report's text (rows: [{ scene, stats, tier0, tier1, mem, steps, why }], head: { ua, w, h, dpr, cityDpr, cap, at }) */
export function benchText(head, rows, extra = {}) {
  const pad = (s, n) => String(s).padEnd(n);
  const L = [
    'NEON SPEAKEASY — THE PHONE BENCH (C4c, City 2.0)',
    `${head.at} · ${head.w}×${head.h} pt · device dpr ${head.dpr} · the city at ${head.cityDpr}×${head.cap > 2 ? ' (&dpr=3)' : ''} · ${head.ua}`,
    `each scene: ${BENCH.settle / 1000} s to settle, then ${BENCH.measure / 1000} s measured. frames = the time between frames (16.7 = 60 fps); work = the city's own draw per frame; slow = frames over 20 ms`,
    '',
    `${pad('scene', 38)} ${pad('fps', 6)} ${pad('frames p50/p95/worst ms', 25)} ${pad('slow', 6)} ${pad('work mean/p95 ms', 18)} ${pad('tier', 10)} canvases MB`,
  ];
  for (const r of rows) {
    const s = r.stats;
    L.push(`${pad(r.scene, 38)} ${pad(s.fps, 6)} ${pad(`${s.p50} / ${s.p95} / ${s.worst}`, 25)} ${pad(`${s.slow}%`, 6)} ${pad(`${s.work} / ${s.workP95}`, 18)} ${pad(`${r.tier0}→${r.tier1}`, 10)} ${r.mem}`);
    if (r.steps && r.steps.length) for (const st of r.steps) L.push(`    ${st.dir === 'down' ? '↓' : st.dir === 'up' ? '↑' : '·'} ${st.at} s: ${st.text}`);
    if (r.why) L.push(`    mostly at 60 because: ${r.why}`);
  }
  L.push('');
  if (extra.guard) L.push(`memory guard: ${extra.guard}`);
  if (extra.tierLog && extra.tierLog.length) { L.push('every quality step this visit:'); for (const st of extra.tierLog.slice(-20)) L.push(`  ${st.at} s ${st.dir}: ${st.text}`); }
  if (extra.note) L.push(extra.note);
  return L.join('\n');
}

/**
 * o: { apply(params) — a preview state now, legend(kind) — start a legendary now, clear() — back to the page's own (any legendary stopped), hold(on) — the panel's re-apply held off while it runs,
 * hook(fn | null) — fn(dt ms, work ms) every frame, snap() → { tier, dprTier, dpr, W, H, mem, tierLog, fast }, send(text) → Promise<bool> }
 */
export function createBench(o) {
  // (&benchfast=1 — the tests: every settle + measure 10× shorter)
  const K = o.fast ? 0.1 : 1, SETTLE = BENCH.settle * K, MEAS = sc => (sc.measure || BENCH.measure) * K;
  const st = { running: false, done: false, i: -1, phase: '', left: 0, report: '', sent: null };
  let el = null, statusEl = null, timer = 0, raf = 0, destroyed = false;
  const css = (n, s) => { for (const k in s) n.style[k] = s[k]; return n; };
  const mk = (tag, s, text) => { const n = document.createElement(tag); if (s) css(n, s); if (text != null) n.textContent = text; return n; };
  const btn = (label, on) => { const b = mk('button', { font: '600 15px "Chakra Petch", system-ui, sans-serif', letterSpacing: '0.08em', color: '#fff', background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.45)', borderRadius: '22px', minHeight: '44px', padding: '0 18px', margin: '6px 6px 0 0', cursor: 'pointer' }, label); b.type = 'button'; b.addEventListener('click', on); return b; };
  function card() {
    if (el) el.remove();
    el = mk('div', { position: 'fixed', left: '12px', right: '12px', top: 'calc(env(safe-area-inset-top, 0px) + 64px)', zIndex: '90', maxWidth: '560px', margin: '0 auto', padding: '14px 16px', borderRadius: '16px',
      background: 'rgba(10,8,22,0.86)', border: '1px solid rgba(255,255,255,0.28)', color: '#f2eef8', font: '14px "Chakra Petch", system-ui, sans-serif', boxShadow: '0 8px 30px rgba(0,0,0,0.5)' });
    el.className = 'hb-bench';
    el.append(mk('div', { font: '700 16px "Orbitron", system-ui, sans-serif', letterSpacing: '0.12em', marginBottom: '6px' }, 'THE PHONE BENCH'));
    statusEl = mk('div', { lineHeight: '1.4', color: '#d9d2e6' });
    el.append(statusEl);
    document.body.append(el);
    return el;
  }
  function idle() {
    card();
    statusEl.textContent = `${BENCH_SCENES.length} heavy scenes, ~${Math.round(BENCH_SCENES.reduce((a, sc) => a + BENCH.settle + (sc.measure || BENCH.measure), 0) / 6000) / 10} min. Keep the phone awake, the screen on, this page in front. The report shows here at the end + goes to /admin.`;
    el.append(btn('START', start), btn('CLOSE', close));
  }
  function start() {
    if (st.running) return;
    st.running = true; st.done = false; st.i = -1; rows.length = 0;
    o.hold(true);
    card();
    const stop = btn('STOP', () => finish('stopped by a tap'));
    el.append(stop);
    next();
  }
  const rows = [];
  let cur = null;
  function next() {
    st.i++;
    if (st.i >= BENCH_SCENES.length) { finish(); return; }
    const sc = BENCH_SCENES[st.i];
    o.clear(); o.apply({ ...sc.q }); if (sc.legend && o.legend) o.legend(sc.legend);
    cur = { sc, dts: [], works: [], phase: 'settle', t0: performance.now(), tier0: null, steps0: (o.snap().tierLog || []).length, fast: new Map(), memMax: 0 };
    o.hook((dt, work) => {
      if (!cur) return;
      if (cur.phase === 'measure') { cur.dts.push(dt); cur.works.push(work); const f = o.snap().fast || 'calm'; cur.fast.set(f, (cur.fast.get(f) || 0) + 1); }
    });
    tick();
  }
  function tick() {
    if (destroyed || !cur) return;
    const now = performance.now(), el9 = now - cur.t0;
    if (cur.phase === 'settle' && el9 >= SETTLE) { cur.phase = 'measure'; cur.t0 = now; const s = o.snap(); cur.tier0 = `${s.tier}/${s.dprTier}`; }
    if (cur.phase === 'measure') { const s = o.snap(); cur.memMax = Math.max(cur.memMax, (s.mem && s.mem.tracked) || 0); }
    const left = cur.phase === 'settle' ? SETTLE - el9 : MEAS(cur.sc) - (now - cur.t0);
    statusEl.textContent = `${st.i + 1} / ${BENCH_SCENES.length} · ${cur.sc.label} · ${cur.phase === 'settle' ? 'settling' : 'measuring'} ${Math.max(0, Math.ceil(left / 1000))} s`;
    if (cur.phase === 'measure' && now - cur.t0 >= MEAS(cur.sc)) {
      const s = o.snap(), log = s.tierLog || [], fast = [...cur.fast.entries()].sort((a, b) => b[1] - a[1]).slice(0, 2).map(([k, n]) => `${k} ${Math.round(100 * n / Math.max(1, cur.dts.length))}%`).join(', ');
      rows.push({ scene: cur.sc.label, stats: benchStats(cur.dts, cur.works), tier0: cur.tier0, tier1: `${s.tier}/${s.dprTier}`, mem: cur.memMax.toFixed(1), steps: log.slice(cur.steps0), why: fast });
      cur = null; o.hook(null);
      next();
      return;
    }
    timer = setTimeout(tick, 250);
  }
  function finish(why = '') {
    clearTimeout(timer); o.hook(null); cur = null;
    try { o.clear(); } catch { /* polish */ }
    o.hold(false);
    st.running = false; st.done = true;
    const s = o.snap(), g = s.mem && s.mem.guard;
    const head = { at: new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC', ua: navigator.userAgent, w: Math.round(innerWidth), h: Math.round(innerHeight), dpr: window.devicePixelRatio || 1, cityDpr: s.dpr, cap: s.cap || 2 };
    st.report = benchText(head, rows, { guard: (g ? (g.stepped.length ? `STEPPED DOWN ${g.stepped.map(x => `${x.name} ${x.from}→${x.to}`).join(', ')}` : `nothing stepped down at the last layout (the bakes want ${g.want} MB + ${g.others} MB else live, of a ${g.budget} MB budget)`) : '—') + (s.mem ? ` · every live canvas now ${s.mem.tracked} MB (${s.mem.canvases})` : ''), tierLog: s.tierLog, note: [why ? `(${why})` : '', o.fast ? '(&benchfast=1: a test run — 10× shorter windows)' : ''].filter(Boolean).join(' ') });
    card();
    statusEl.textContent = rows.length ? 'Done. The report:' : 'Stopped.';
    const ta = mk('textarea', { width: '100%', height: '42vh', marginTop: '8px', font: '11px/1.35 "JetBrains Mono", ui-monospace, monospace', color: '#e8e4f0', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', padding: '8px', boxSizing: 'border-box', whiteSpace: 'pre' });
    ta.readOnly = true; ta.value = st.report;
    el.append(ta);
    const sentEl = mk('div', { marginTop: '6px', color: '#c8bfda' }, 'Sending to /admin …');
    el.append(btn('COPY', () => copy(ta)), btn('RUN AGAIN', start), btn('CLOSE', close), sentEl);
    if (rows.length) o.send(st.report).then(ok => { st.sent = ok; sentEl.textContent = ok ? 'Saved to /admin → Reports from phones ✓' : 'Not saved to /admin (offline, or the hourly limit) — COPY it instead.'; });
    else sentEl.textContent = '';
  }
  function copy(ta) {
    const done = ok => { const b = [...el.querySelectorAll('button')].find(x => x.textContent.startsWith('COPY')); if (b) b.textContent = ok ? 'COPIED ✓' : 'SELECT + COPY'; };
    try { if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(ta.value).then(() => done(true), () => { ta.select(); done(document.execCommand && document.execCommand('copy')); }); return; } } catch { /* fall through */ }
    ta.focus(); ta.select(); try { done(document.execCommand('copy')); } catch { done(false); }
  }
  function close() { if (st.running) finish('closed'); if (el) el.remove(); el = null; }
  idle();
  return {
    start, stop: () => finish('stopped'), close,
    state: () => ({ running: st.running, done: st.done, i: st.i, scene: cur ? cur.sc.id : null, phase: cur ? cur.phase : '', rows: rows.length, sent: st.sent, report: st.report }),
    destroy() { destroyed = true; clearTimeout(timer); cancelAnimationFrame(raf); try { o.hook(null); o.hold(false); } catch { /* */ } if (el) el.remove(); el = null; },
  };
}
