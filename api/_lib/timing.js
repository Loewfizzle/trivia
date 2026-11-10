// Server-Timing (DFIX3 — no secrets): the phases of a call in ms + the region the function ran in → the header's value.
// Shared by /api/daily (THE DIG PATH) and THE HOLD'EM DEALER (/api/report's holdem actions — HE2).
export function timing() {
  const t0 = performance.now();
  let last = t0;
  const marks = [];
  const r = v => Math.round(v * 10) / 10;
  return {
    mark(name, desc) { const t = performance.now(); marks.push([name, r(t - last), desc]); last = t; },
    header() {
      const parts = marks.map(([n, d, x]) => `${n};dur=${d}${x != null ? `;desc="${String(x).replace(/[^\w .:-]/g, '')}"` : ''}`);
      parts.push(`total;dur=${r(performance.now() - t0)}`);
      if (process.env.VERCEL_REGION) parts.push(`region;desc="${String(process.env.VERCEL_REGION).replace(/[^\w-]/g, '')}"`);
      return parts.join(', ');
    },
  };
}
export const noTiming = { mark() {}, header: () => '' };
