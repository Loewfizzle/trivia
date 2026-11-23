// JAYWALK SMOOTH — THE ONE READING of a list of frame intervals (PURE, no DOM): the lab's meter (lab-hud.js) + every perf run (tests/integration).
/** a dropped frame: an interval past one 60 Hz frame's slack · a BIG drop: two frames or more */
export const DROP_MS = 20, BIG_MS = 33;

/** PURE: frame intervals (ms) → { n, fps, drops, big, p50, p95, p99, worst } — the meter's + the perf runs' ONE reading */
export function frameStats(list, { dropMs = DROP_MS, bigMs = BIG_MS } = {}) {
  const a = Array.from(list).filter(v => v > 0).sort((x, y) => x - y), n = a.length;
  if (!n) return { n: 0, fps: 0, drops: 0, big: 0, p50: 0, p95: 0, p99: 0, worst: 0 };
  const at = p => a[Math.min(n - 1, Math.floor(n * p))];
  let sum = 0, drops = 0, big = 0;
  for (const v of a) { sum += v; if (v > dropMs) drops++; if (v > bigMs) big++; }
  return { n, fps: 1000 * n / sum, drops, big, p50: at(0.5), p95: at(0.95), p99: at(0.99), worst: a[n - 1] };
}
