// HIGH RISE — THE ON-PHONE TRACE (S4A FIX 2 — docs/highrise.md "THE TRACE"; the owner's iPhone counts HITCH 95–114 a long run, the
// biggest named cause "tap" = the landing frame, and the Beelink can not make an iPhone stall): `?trace=1` on the test page times EVERY
// frame in PHASES with performance.now and keeps THE 5 WORST — the end card shows them (the owner screenshots it).
// THE RECORD a frame's GAP is charged to = everything the page's own code did since the frame before began: that frame's phases + any
// touch handled after it (a stall is the time between two frames — whatever ran in it). What the page's code did NOT take of the gap
// (past one ordinary frame) is the BROWSER's: a collection, its own style / layout / paint, the GPU, the compositor — the line says
// "browser n", never a guess at which.
// ZERO GARBAGE: every number lives in typed arrays made here, once; a frame writes into them and builds nothing. OFF (no ?trace=1) the
// stage + the scene hold `null` and every call site is one `if (TR)` — nothing else runs.

/** the phases, in the order a frame runs them (+ the touch, between two frames) */
export const PH = Object.freeze({ input: 0, engine: 1, fx: 2, audio: 3, view: 4, flyers: 5, render: 6, bloom: 7, hud: 8, other: 9 });
export const PH_NAMES = Object.freeze(['tap', 'engine', 'fx', 'audio', 'view', 'flyers', 'render', 'bloom', 'hud', 'other']);
const NP = PH_NAMES.length, BROWSER = NP;   // (the pseudo-phase: the gap the page's own code did not take)
/** what happened in a record (a bit each) — the end card names them */
export const EV = Object.freeze({ land: 1, perfect: 2, cut: 4, seam: 8, flyer: 16, grow: 32, out: 64, plate: 128, compile: 256, decode: 512, deferred: 1024, num: 2048, tags: 4096 });
// (S4B: `num` = the frame that wrote the big number — two frames after its landing — · `tags` = the one that placed the right-edge tags:
//  a landing's deferred DOM writes are NAMED, never "none" — the owner's panel then says which of them Safari was painting)
const EV_NAMES = ['land', 'perfect', 'cut', 'seam', 'flyer', 'grow', 'out', 'plate', 'compile', 'decode', 'later', 'num', 'tags'];
/** the worst frames kept · a frame over this is counted by its top phase · a phase under this is no cause (the browser's, then) */
export const WORST = 5, OVER_MS = 33;

/** S4B — the first-time work a run may do AFTER ITS FIRST TAP (the pre-warm's check): a program compiled · a picture / a model uploaded · a sound decoded */
export const SETUP = Object.freeze({ compile: 0, upload: 1, decode: 2 });
const SETUP_NAMES = ['compile', 'upload', 'decode'];

export function createTrace({ lean = false } = {}) {
  const acc = new Float64Array(NP), L = new Float64Array(3);   // (L: 0 the lap's start · 1 the frames counted · 2 the usual frame)
  const wGap = new Float64Array(WORST), wWork = new Float64Array(WORST), wPh = new Float64Array(WORST * (NP + 1)), wFloor = new Int32Array(WORST), wEv = new Int32Array(WORST);
  const over = new Int32Array(NP + 1);
  // (the pass's measure: every LANDING frame's own work (a record with a land in it) in a ring + every touch's; the other frames' sum)
  const RING = 512, landW = new Float64Array(RING), tapW = new Float64Array(RING), S = new Float64Array(6), landPh = new Float64Array(NP);   // (S: 0 lands · 1 taps · 2 plain frames · 3 their work · 4 lands' work · 5 taps' work)
  const setN = new Int32Array(3), setAt = new Int32Array(3);   // (how many of each since the first tap · the floor of the first)
  let ev = 0, overN = 0;
  L[2] = 1000 / 60;
  const T = {
    /** this record's events (EV bits — `T.ev |= EV.land`) */
    get ev() { return ev; }, set ev(v) { ev = v; },
    /** a frame begins: the record that ends with this gap is closed (`count` = a live run's frame, after its first second) */
    begin(now, gap, floor, count) {
      if (count) close(gap, floor);
      if (gap > 0 && gap < 100) L[2] += (gap - L[2]) * 0.05;
      for (let i = 0; i < NP; i++) acc[i] = 0;
      ev = 0; L[0] = now;
    },
    /** the time since the last lap goes to phase `p` */
    lap(p) { const t = performance.now(); acc[p] += t - L[0]; L[0] = t; },
    /** a piece of work outside the frame's sequence (the touch handler): `ms` to phase `p` */
    add(p, ms) { acc[p] += ms; },
    /** S4B — first-time work after the first tap: counted by kind, the first one's floor kept (two numbers written — nothing made) */
    setup(kind, floor) { if (!setN[kind]++) setAt[kind] = floor; },
    /** a new run: nothing kept */
    reset() { setN.fill(0); setAt.fill(0); wGap.fill(0); wWork.fill(0); wPh.fill(0); wFloor.fill(0); wEv.fill(0); over.fill(0); overN = 0; L[1] = 0; S.fill(0); landPh.fill(0); },
    frames: () => L[1],
    /** the end card's lines (built once, at the end — never in a frame) */
    lines() {
      const out = [`TRACE${lean ? ' · LEAN' : ''} · ${WORST} WORST FRAMES OF ${L[1]}`];
      for (let k = 0; k < WORST; k++) {
        if (!wGap[k]) break;
        const o = k * (NP + 1);
        let a = -1, b = -1;
        for (let i = 0; i <= NP; i++) { const v = wPh[o + i]; if (a < 0 || v > wPh[o + a]) { b = a; a = i; } else if (b < 0 || v > wPh[o + b]) b = i; }
        const nm = i => (i === BROWSER ? 'browser' : PH_NAMES[i]), ms = v => (v >= 10 ? Math.round(v) : Math.round(v * 10) / 10);
        let what = '';
        for (let i = 0; i < EV_NAMES.length; i++) if (wEv[k] & (1 << i)) what += (what ? '+' : '') + EV_NAMES[i];
        out.push(`${Math.round(wGap[k])} ms · F${wFloor[k]} · ${what || 'none'} · ${nm(a)} ${ms(wPh[o + a])}${b >= 0 && wPh[o + b] >= 0.5 ? ` · ${nm(b)} ${ms(wPh[o + b])}` : ''}`);
      }
      let by = '';
      for (let i = 0; i <= NP; i++) if (over[i]) by += `${by ? ' · ' : ''}${i === BROWSER ? 'browser' : PH_NAMES[i]} ${over[i]}`;
      out.push(`> ${OVER_MS} MS: ${overN}${by ? ` — ${by}` : ''}`);
      // (S4B — THE PRE-WARM's check: anything compiled / uploaded / decoded for the first time AFTER the first tap)
      let su = '';
      for (let i = 0; i < 3; i++) if (setN[i]) su += `${su ? ' · ' : ''}${SETUP_NAMES[i]} ${setN[i]} @F${setAt[i]}`;
      out.push(`SET-UP AFTER START: ${su || 'none'}`);
      return out;
    },
    /** the pass's checks: the worst records as plain data */
    worst() {
      const r = [];
      for (let k = 0; k < WORST && wGap[k]; k++) { const ph = {}; for (let i = 0; i <= NP; i++) ph[i === BROWSER ? 'browser' : PH_NAMES[i]] = Math.round(wPh[k * (NP + 1) + i] * 100) / 100; r.push({ gap: Math.round(wGap[k] * 10) / 10, work: Math.round(wWork[k] * 100) / 100, floor: wFloor[k], ev: wEv[k], ph }); }
      const q = (a, n) => { const v = Array.from(a.subarray(0, Math.min(n, RING))).sort((x, y) => x - y); return v.length ? { n, mean: Math.round(v.reduce((x, y) => x + y, 0) / v.length * 100) / 100, p95: Math.round(v[Math.floor(v.length * 0.95)] * 100) / 100, max: Math.round(v[v.length - 1] * 100) / 100 } : { n: 0 }; };
      return { lean, setup: { compile: setN[0], upload: setN[1], decode: setN[2], at: Array.from(setAt) }, frames: L[1], over: overN, by: Array.from(over), worst: r, land: q(landW, S[0]), landPh: Object.fromEntries(PH_NAMES.map((k, i) => [k, S[0] ? Math.round(landPh[i] / S[0] * 1000) / 1000 : 0])), tap: q(tapW, S[1]), plain: { n: S[2], mean: S[2] ? Math.round(S[3] / S[2] * 100) / 100 : 0 } };
    },
  };
  function close(gap, floor) {
    L[1]++;
    let work = 0;
    for (let i = 0; i < NP; i++) work += acc[i];
    const rest = Math.max(0, gap - work - L[2]);
    if (ev & 1) { landW[S[0]++ % RING] = work - acc[0]; for (let i = 0; i < NP; i++) landPh[i] += acc[i]; } else { S[2]++; S[3] += work - acc[0]; }
    if (acc[0] > 0) tapW[S[1]++ % RING] = acc[0] + acc[3];
    if (gap > OVER_MS && gap > 1.5 * L[2]) {   // (and over 1.5 × the phone's own usual frame — Low Power Mode draws at 30 Hz: none of those a stall)
      overN++;
      let a = BROWSER, av = rest;
      for (let i = 0; i < NP; i++) if (acc[i] > av) { a = i; av = acc[i]; }
      over[a]++;
    }
    // (kept sorted, worst first: a record worse than the last kept one goes in its place and sinks — five numbers moved, nothing made)
    if (gap <= wGap[WORST - 1]) return;
    let k = WORST - 1;
    while (k > 0 && wGap[k - 1] < gap) {
      wGap[k] = wGap[k - 1]; wWork[k] = wWork[k - 1]; wFloor[k] = wFloor[k - 1]; wEv[k] = wEv[k - 1];
      for (let i = 0; i <= NP; i++) wPh[k * (NP + 1) + i] = wPh[(k - 1) * (NP + 1) + i];
      k--;
    }
    wGap[k] = gap; wWork[k] = work; wFloor[k] = floor; wEv[k] = ev;
    for (let i = 0; i < NP; i++) wPh[k * (NP + 1) + i] = acc[i];
    wPh[k * (NP + 1) + BROWSER] = rest;
  }
  return T;
}
