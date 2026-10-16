#!/usr/bin/env node
// NEON PAR hole validation bot: proves every hole can be finished at or under par and measures how
// rare a hole-in-one is. For each hole it fires a grid of shots (angle × power) from the tee at several
// moments of the moving obstacles' cycles, keeps a diverse beam of the best resting spots, and searches
// again from those, up to par strokes.
//
//   node scripts/validate-holes.mjs            # all holes, full grid (prints the report table)
//   node scripts/validate-holes.mjs 4 5        # just holes 4 and 5
//   QUICK=1 node scripts/validate-holes.mjs    # coarser grid (what the unit test uses)
import { HOLES } from '../js/games/golf/holes/index.js';
import { simulate, ridePosition, CUP_R } from '../js/games/golf/physics.js';

const QUICK = !!process.env.QUICK;
const ANG_STEP = QUICK ? 4 : 2;            // degrees
const POWERS = [];
for (let p = 0.08; p <= 1.0001; p += QUICK ? 0.06 : 0.04) POWERS.push(+p.toFixed(3));
const BEAM = QUICK ? 6 : 10;

function startTimes(hole, base) {
  const periods = (hole.movers || []).map(m => m.period || (Math.PI * 2) / Math.abs(m.speed || 1));
  if (!periods.length) return [base];
  const P = Math.max(...periods);
  const n = QUICK ? 4 : 6;
  return Array.from({ length: n }, (_, i) => base + (P * i) / n);
}

/** All shots from one position: returns { aces, total, rests: [{pos, riding, t}], aceShots: [{ang, p, t}] } */
function fan(hole, pos, riding, t0) {
  let aces = 0, total = 0;
  const rests = [];
  const aceShots = [];
  for (const t of startTimes(hole, t0)) {
    const from = ridePosition(hole, pos, riding, t);
    for (let a = 0; a < 360; a += ANG_STEP) {
      const ang = (a * Math.PI) / 180;
      for (const p of POWERS) {
        const s = simulate(hole, from, ang, p, t);
        total++;
        if (s.holed) { aces++; aceShots.push({ ang, p, t, from }); continue; }
        if (s.oob) continue;
        rests.push({ pos: [s.x, s.y], riding: s.riding || null, t: s.t });
      }
    }
  }
  return { aces, total, rests, aceShots };
}

// A skilled player aiming at an ace line still has error. On a phone slingshot that is roughly angle σ ≈ 2.5°,
// power σ ≈ 6 % and (for moving obstacles) timing σ ≈ 0.12 s.
// "Aimed ace chance" = the best such line's success rate (seeded, so the report is stable).
function aimedAceChance(hole, aceShots) {
  if (!aceShots.length) return 0;
  let seed = 12345;
  const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
  const gauss = () => Math.sqrt(-2 * Math.log(rnd() + 1e-12)) * Math.cos(2 * Math.PI * rnd());
  let best = 0;
  const N = QUICK ? 60 : 160;
  for (const a of aceShots.slice(0, QUICK ? 12 : 40)) {
    let hits = 0;
    for (let i = 0; i < N; i++) {
      const s = simulate(hole, a.from, a.ang + gauss() * (2.5 * Math.PI / 180), Math.min(1, Math.max(0.02, a.p * (1 + gauss() * 0.06))), a.t + (hole.movers && hole.movers.length ? gauss() * 0.12 : 0));
      if (s.holed) hits++;
    }
    best = Math.max(best, hits / N);
  }
  return best;
}

const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

/** Diverse beam: best spots by distance to the cup, at most one per 3×3 cell. */
function beam(hole, rests) {
  const seen = new Set();
  const out = [];
  for (const r of rests.sort((a, b) => dist(a.pos, hole.cup) - dist(b.pos, hole.cup))) {
    const key = `${Math.round(r.pos[0] / 3)},${Math.round(r.pos[1] / 3)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(r);
    if (out.length >= BEAM) break;
  }
  return out;
}

export function validateHole(hole) {
  const first = fan(hole, hole.tee, null, 0);
  const aceChance = first.aces / first.total;
  const aimed = aimedAceChance(hole, first.aceShots);
  let best = first.aces ? 1 : null;
  let frontier = beam(hole, first.rests);
  for (let strokes = 2; strokes <= hole.par + 1 && best == null; strokes++) {
    const next = [];
    for (const f of frontier) {
      const r = fan(hole, f.pos, f.riding, f.t + 0.5);
      if (r.aces) { best = strokes; break; }
      next.push(...r.rests);
    }
    frontier = beam(hole, next);
  }
  return { id: hole.id, name: hole.name, par: hole.par, best, aceChance, aimed, shots: first.total, closest: frontier.length ? dist(frontier[0].pos, hole.cup) - CUP_R : null };
}

if (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}` || process.argv[1].endsWith('validate-holes.mjs')) {
  const only = process.argv.slice(2).map(Number).filter(Boolean);
  console.log(`hole                 par  best   ace: random shot | aimed (skilled)   shots tested`);
  let ok = true;
  HOLES.forEach((h, i) => {
    if (only.length && !only.includes(i + 1)) return;
    const t = Date.now();
    const r = validateHole(h);
    const pass = r.best != null && r.best <= h.par;
    ok = ok && pass;
    console.log(`${String(i + 1).padStart(2)} ${h.name.padEnd(17)} ${String(h.par).padStart(3)}  ${String(r.best ?? '—').padStart(4)}  ${(r.aceChance * 100).toFixed(2).padStart(6)}%      | ${(r.aimed * 100).toFixed(0).padStart(3)}%           ${String(r.shots).padStart(6)}   ${pass ? 'OK' : 'FAIL'}  (${((Date.now() - t) / 1000).toFixed(1)} s)`);
  });
  process.exitCode = ok ? 0 : 1;
}
