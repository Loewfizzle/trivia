// POLISH 5 — THE LOAD LOG (PURE; the owner, Oct 25: "upon loading, the buildings and stuff shift around and fade around and jump
// around until it's loaded" — on his iPhone, in a Safari tab, every load). The scene writes every change to the picture into it from
// the first frame until LOAD_LOG_MS after the REVEAL (the city fading in), each with its cause; the &debug=1 readout shows it as a
// foldable strip (ui/debug-strip.js, id 'load') so a screenshot of the phone says what still moves; tests read harbor().loadLog.
//
// kinds (the ones that CHANGE THE PICTURE after the reveal are VISIBLE — the load check fails on any of them):
//   reveal   the city let in: why (ready | late) + ms since the scene started, + what it waited for
//   resize   the window / visualViewport / screen sizes before → after (Safari's bars), and what the scene did with it
//   canvas   the canvas re-sized (W×H @ dpr before → after)                                    VISIBLE
//   layout   the camera re-laid (why: build / the dock moved / a safe area / tonight's signs)  VISIBLE
//   bake     a re-bake of the city: swapped (before the reveal) or CROSSFADED + the key's parts that changed    VISIBLE if crossfaded
//   lit      the lit windows re-baked (crossfaded after the reveal)                            VISIBLE if crossfaded
//   tier     a quality step (from → to + why), or a step recorded for later (wantStep)          VISIBLE if applied
//   wx       the weather: the cached answer read, the live one landing, its kind
//   sky      the sky repainted (crossfaded after the reveal: how long)                          VISIBLE if instant
//   clouds   the clouds re-planned (their kinds) / born                                         VISIBLE if re-planned
//   fonts    the fonts in
//   dock     the title's rects moved (the dock / the tagline) — kept or re-laid
//   extras   the weather's modules in (fog, rain, frost)
//   pix      a band of the picture's mean brightness jumped (the watch, &debug=1 only) — anything not instrumented
//   power    the same, while the city's power-on runs (the neon tube by tube, the windows) — by design, never counted
//   note     anything else worth a line
export const LOAD_LOG_MS = 15000;
const VISIBLE = new Set(['canvas', 'layout', 'pix']);

/** is this row a change the eye sees, after the reveal? (a crossfaded bake / lit / sky counts; a swap before the reveal never shows) */
export function visibleRow(r) {
  if (r.a == null) return false;                       // (before the reveal: the city is dark)
  if (VISIBLE.has(r.kind)) return true;
  if (r.kind === 'bake' || r.kind === 'lit') return !!r.fade;
  if (r.kind === 'tier') return !!r.applied;
  if (r.kind === 'sky') return !r.slow;                // (a slow weather blend is the design; an instant jump is not)
  if (r.kind === 'clouds') return !!r.replan && !r.slow;
  return false;
}

/**
 * the log. t0: the scene's start (performance.now()); now(): the clock (tests pass a fake).
 * add(kind, msg, extra?) → the row or null (after the window / over the cap); reveal(why, extra) marks the reveal.
 */
export function createLoadLog(t0, { now = () => performance.now(), win = LOAD_LOG_MS, max = 90 } = {}) {
  const rows = [];
  let shownAt = -1, dropped = 0;
  const api = {
    rows,
    get shownAt() { return shownAt; },
    get dropped() { return dropped; },
    /** still recording? (until win ms after the reveal) */
    open(t = now()) { return shownAt < 0 || t <= shownAt + win; },
    add(kind, msg, extra = null, t = now()) {
      if (!api.open(t)) return null;
      if (rows.length >= max) { dropped++; return null; }
      const r = { t: Math.round(t - t0), a: shownAt >= 0 ? Math.round(t - shownAt) : null, kind, msg, ...(extra || {}) };
      rows.push(r);
      return r;
    },
    reveal(why, msg, t = now()) {
      shownAt = t;
      return api.add('reveal', `${why} at ${Math.round(t - t0)} ms${msg ? ` · ${msg}` : ''}`, { why }, t);
    },
    /** the rows that changed the picture after the reveal */
    visible: () => rows.filter(visibleRow),
    /** the strip's lines: `+1.24 s  bake   crossfade · wx (tones)` — before the reveal `−0.40 s` (from it), newest last */
    lines(n = 26) {
      const fmt = r => {
        const s = r.a == null ? (shownAt >= 0 ? (r.t - Math.round(shownAt - t0)) / 1000 : r.t / 1000) : r.a / 1000;
        const sign = r.a == null && shownAt >= 0 ? '−' : r.a == null ? ' ' : '+';
        return `${sign}${Math.abs(s).toFixed(2)}s ${r.kind.padEnd(6)} ${visibleRow(r) ? '⚠ ' : ''}${r.msg}`;
      };
      const out = rows.map(fmt);
      return out.length > n ? [`(${out.length - n} earlier)`, ...out.slice(-n)] : out;
    },
    /** the folded one-liner: `LOAD ready 1.12 s · 0 changes after ▸` */
    head() {
      const rv = rows.find(r => r.kind === 'reveal');
      const v = api.visible().length;
      if (!rv) return `LOAD … ${((now() - t0) / 1000).toFixed(1)} s (dark)`;
      return `LOAD ${rv.why} ${(Math.round(shownAt - t0) / 1000).toFixed(2)} s · ${v ? `${v} change${v > 1 ? 's' : ''} after the reveal` : 'still after the reveal'}${api.open() ? '' : ' (done)'}`;   // (SP3: the count = post-reveal rows the eye sees only — visibleRow)
    },
  };
  return api;
}

/** the parts of two '|'-joined keys that differ, named (the bake key's: season, lamps, road, tones, sun, camera, neon, flood, facade) */
export function keyDiff(a, b, names = []) {
  if (!a) return 'first';
  const x = String(a).split('|'), y = String(b).split('|'), out = [];
  for (let i = 0; i < Math.max(x.length, y.length); i++) if (x[i] !== y[i]) out.push(names[i] || `#${i}`);
  return out.length ? out.join(', ') : 'same';
}
