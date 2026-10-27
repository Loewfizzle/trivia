// CITY 2.0 — PART 9b: THE WINTER PEOPLE (live; the figures are folk.js's, sorted in by depth with everyone — people.js#draw's extra
// items). Judged unzoomed on the phone: whole-body motion + one bright accent (the white of the snow thrown), never small props alone.
//   THE DOORMAN SHOVELS the speakeasy's steps the morning after snow (7:20–8:20; &force=shovel): big strokes, a clump of snow thrown
//     aside every stroke, then a fan of salt; the path he clears is baked into the ground (snow.js#groundSteps: `door`).
//   A SHOVELLER on the front walk the day it snowed (9–11 am): working slowly along the walk, clumps tossed toward the curb.
//   THE SNOWBALL FIGHT: kids on the plaza on snowy WEEKEND afternoons (Sat + Sun, 1–4:30 pm, two seeded sessions; &force=snowball) —
//     scoop, wind up, THROW: a big white ball on a readable arc + a burst where it lands.
//   A SLIP on a THAW night (6–11 pm, now + then; &force=slip): a walker's feet go, arms fly out, they catch themselves + walk on.
import { lookOf, drawFolk } from './folk.js';
import { project } from '../../core/harbor-layout.js';
import { rngFrom, hashString } from '../../core/rng.js';

const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);

/** PURE: what winter work + play is on at this local time — { shovel, shoveller, snowball (session seed | null), slip } */
export function winterActs(lc, sn, o = {}) {
  const f = o.force || new Set(), h = lc ? lc.h + lc.mi / 60 : 12, dow = lc ? lc.dow : 3;
  const has = sn && sn.stage !== 'none', fresh = has && sn.stage === 'fresh', deep = has && sn.cover >= 0.5 && sn.stage !== 'thaw' && sn.stage !== 'spring';
  const day = lc ? `${lc.y}-${lc.m}-${lc.d}` : '';
  const r = rngFrom(hashString(`winter|${day}`));
  const s1 = 13 + r() * 1.2, s2 = 14.9 + r() * 1.2;
  const inFight = (dow === 0 || dow === 6) && deep && !(o.falling > 0.6) && ((h >= s1 && h < s1 + 0.2) || (h >= s2 && h < s2 + 0.2));
  return {
    shovel: f.has('shovel') || (has && (fresh || sn.age <= 1) && h >= 7.33 && h < 8.33),
    shoveller: f.has('shovel') || (fresh && !(o.falling > 0.6) && h >= 9 && h < 11),
    snowball: f.has('snowball') ? 'forced' : inFight ? `${day}|${h < s2 ? 1 : 2}` : null,
    slip: f.has('slip') || (has && sn.stage === 'thaw' && h >= 18 && h < 23),
  };
}
/** PURE: the speakeasy's front steps cleared yet today? (the doorman's path, baked) — after his morning round, or any stage past fresh */
export const doorCleared = (lc, sn) => !!sn && sn.stage !== 'none' && (sn.stage !== 'fresh' || (lc && lc.h + lc.mi / 60 >= 8.2));

export function createWinterFolk() {
  const looks = new Map();
  const lookFor = (name, seed, carry) => { const k = `${name}|${seed}|${carry || ''}`; let l = looks.get(k); if (!l) { l = { ...lookOf(name, seed, { season: 'winter', cold: true }), ...(carry !== undefined ? { carry } : {}) }; looks.set(k, l); if (looks.size > 40) looks.delete(looks.keys().next().value); } return l; };
  let balls = [], puffs = [], lastT = 0;

  /** a white clump / ball / burst in screen space */
  function blob(c, x, y, r, col, a = 1, edge = false) {
    c.globalAlpha = a;
    if (edge) { c.fillStyle = 'rgba(60,70,100,0.55)'; c.beginPath(); c.arc(x + 0.25, y + 0.35, Math.max(1.3, r) + 0.7, 0, 6.2832); c.fill(); }   // (a soft shaded edge: a white ball reads against white snow)
    c.fillStyle = col; c.beginPath(); c.arc(x, y, Math.max(0.9, r), 0, 6.2832); c.fill(); c.globalAlpha = 1;
  }

  /**
   * the items for the near pass: [{ z, draw(c) }] — w: { L, t (the city clock, s), lc (local time), sn (the snow state), falling, force,
   * env (people.js's draw env: T, dark, lightAt, shadow, mo, tier), snowCol ([r,g,b]) }
   */
  function items(w) {
    const { L, t, env } = w, cam = L.cam, s = L.speakeasy, mo = env.mo !== false, col = `rgb(${w.snowCol.map(v => v | 0).join(',')})`;
    const acts = winterActs(w.lc, w.sn, { force: w.force, falling: w.falling });
    const out = [], E = { ...env, t: env.t };
    const dt = Math.max(0, Math.min(0.1, t - lastT)); lastT = t;
    const fig = (name, seed, st, extra) => ({ z: st.z, draw: c => { drawFolk(c, cam, { s: st, L: lookFor(name, seed, st.carry) }, E); if (extra) extra(c); } });
    // ---- THE DOORMAN at the steps: shovel strokes, a clump thrown left each stroke; the last third of each minute a fan of salt
    if (acts.shovel && s) {
      const dx = s.x0 + (s.door.u0 + s.door.u1) / 2, z = s.z0 - 1.1, cyc = t % 60, salting = cyc > 44;
      const sway = mo ? Math.sin(t * 0.21) * 0.5 : 0, st = { x: dx + 0.4 + sway, z, pose: salting ? 'point' : 'sweep', v: 0, hd: Math.PI, dist: 0, a: 1, since: 9 };
      out.push(fig('doorman', 4242, { ...st, carry: salting ? null : 'shovel' }, c => {
        const [gx, gy] = project(cam, st.x, 0, z), sp = cam.F / z;
        if (!mo) return;
        if (!salting) { const u = (t % 1.25) / 1.25; if (u > 0.55) { const k = (u - 0.55) / 0.45; blob(c, gx - (0.9 + 1.6 * k) * sp, gy - (0.6 + 1.0 * k - 1.3 * k * k) * sp, 0.32 * sp, col, 1 - k * 0.4); } }
        else { c.fillStyle = 'rgb(232,230,222)'; for (let i = 0; i < 14; i++) { const u = (t * 1.8 + i * 0.37) % 1; c.globalAlpha = 1 - u; c.fillRect(gx + (0.5 + 1.8 * u) * sp * (i % 2 ? 1 : 0.6), gy - (1.0 - 0.9 * u) * sp + (i % 3) * 0.12 * sp, Math.max(0.7, 0.06 * sp), Math.max(0.7, 0.06 * sp)); } c.globalAlpha = 1; }
      }));
    }
    // ---- A SHOVELLER working slowly along the front walk (left → right over two hours), clumps tossed toward the curb
    if (acts.shoveller && L.edge) {
      const zF = (L.impliedOn !== false ? L.edge.z + L.edge.curbW : L.impliedRoad.z0) + 1.6, hw = cam.hw(zF);
      const h = w.lc ? w.lc.h + w.lc.mi / 60 : 10, u = w.force && w.force.has('shovel') ? 0.35 + 0.1 * Math.sin(t * 0.02) : clamp01((h - 9) / 2);
      const st = { x: -hw * 0.8 + u * hw * 1.6, z: zF, pose: 'sweep', v: 0, hd: 0, dist: 0, a: 1, since: 9, carry: 'shovel' };
      out.push(fig('worker', 777, st, c => {
        if (!mo) return;
        const [gx, gy] = project(cam, st.x, 0, zF), sp = cam.F / zF, q = ((t + 0.4) % 1.25) / 1.25;
        if (q > 0.55) { const k = (q - 0.55) / 0.45; blob(c, gx + (0.6 + 1.4 * k) * sp * 0.4, gy - (0.6 + 0.9 * k - 1.2 * k * k) * sp, 0.3 * sp, col, 1 - 0.4 * k); }
      }));
    }
    // ---- THE SNOWBALL FIGHT: two pairs of kids facing each other across the inlay; scoop → wind up → THROW, the ball's arc, the burst
    if (acts.snowball && L.medallion) {
      const m = L.medallion, zc = m.z - 3.2, kids = [{ x: m.x - 4.4, z: zc - 0.5, side: 1 }, { x: m.x - 3.0, z: zc + 0.9, side: 1 }, { x: m.x + 4.0, z: zc - 0.2, side: -1 }, { x: m.x + 2.8, z: zc + 1.1, side: -1 }];   // (nearer the camera than the inlay: big enough to read)
      kids.forEach((k, i) => {
        const P = 3.1 + i * 0.37, ph = (t + i * 1.13) % P;                            // (each kid's own cycle: scoop 0–1.1 s, wind up + throw 1.1–1.9, wait)
        const pose = ph < 1.1 ? 'pick' : ph < 1.9 ? 'throw' : 'wait', since = ph < 1.1 ? ph : ph < 1.9 ? ph - 1.1 : ph - 1.9;
        const st = { x: k.x + (mo ? Math.sin(t * 0.4 + i) * 0.25 : 0), z: k.z, pose, v: 0, hd: k.side > 0 ? 0 : Math.PI, dist: 0, a: 1, since, left: pose === 'pick' ? 1.1 - since : 9 };
        // the release: once per cycle, as the throw snaps forward (0.6 s into it) → a ball to the nearest kid of the other side
        if (mo && pose === 'throw' && since >= 0.6 && since - dt < 0.6) { const tg = kids.filter(o => o.side !== k.side)[i % 2]; balls.push({ x0: k.x + k.side * 0.4, z0: k.z, x1: tg.x + (Math.random() - 0.5) * 1.2, z1: tg.z, t0: t, T: 0.85 }); }
        out.push(fig('kid', 9100 + i * 17, st));
      });
    } else balls = [];
    // ---- A SLIP on a thaw night: a walker along the plaza, the feet going mid-way (arms flung out, a lurch back), caught, on again
    if (acts.slip && L.medallion) {
      const P = w.force && w.force.has('slip') ? 16 : 240, ph = t % P, walkT = 14;
      if (ph < walkT) {
        const z = L.medallion.z - 2.2, hw = cam.hw(z), x = -hw * 0.7 + (ph / walkT) * hw * 1.4, slip = ph > walkT * 0.45 && ph < walkT * 0.45 + 1.1;
        const st = { x, z, pose: slip ? 'slip' : 'walk', v: slip ? 0 : 1.2, hd: 0, dist: x * 1.0, a: 1, since: slip ? ph - walkT * 0.45 : 9 };
        out.push(fig('walker', 6060 + Math.floor(t / P), st));
      }
    }
    // ---- THE SNOWMAN's PEOPLE (core/harbor-snowman.js): his BUILDERS on a January snow day (10 am – 3 pm: two kids rolling + packing,
    // a grown-up lifting at the top) while he isn't finished; once he stands, VISITS now + then — a kid at his face (the pebble smile),
    // someone holding a camera up to him
    if (w.sm && w.sm.standing && L.medallion) {
      const m = L.medallion, h = w.lc ? w.lc.h + w.lc.mi / 60 : 12, f = w.force || new Set();
      const building = f.has('snowman-build') || (w.sm.progress < 1 && w.lc && w.lc.m === 1 && h >= 10 && h < 15 && w.sn && w.sn.stage !== 'none' && !(w.falling > 0.6));
      if (building) {
        out.push(fig('kid', 5101, { x: m.x - 1.7, z: m.z - 0.9, pose: 'push', v: 0, hd: 0, dist: 0, a: 1, since: 9 }));
        out.push(fig('kid', 5117, { x: m.x + 1.6, z: m.z - 1.3, pose: (t % 4) < 1.6 ? 'pick' : 'wait', v: 0, hd: Math.PI, dist: 0, a: 1, since: t % 4, left: 1.6 - (t % 4) }));
        out.push(fig('walker', 5131, { x: m.x + 0.9, z: m.z + 0.9, pose: 'reach', v: 0, hd: Math.PI, dist: 0, a: 1, since: 9 }));
      } else if (w.sm.progress >= 0.93 && h >= 9 && h < 17) {
        const P = 360, ph = t % P, n = Math.floor(t / P);
        if (ph < 50) out.push(n % 2 ? fig('kid', 5200 + (n % 5), { x: m.x - 0.8, z: m.z - 1.1, pose: 'reach', v: 0, hd: 0.3, dist: 0, a: Math.min(1, ph / 2, (50 - ph) / 2), since: 9 })
          : fig('stroll', 5300 + (n % 7), { x: m.x + 2.6, z: m.z - 2.4, pose: 'watch', v: 0, hd: Math.PI * 0.85, dist: 0, a: Math.min(1, ph / 2, (50 - ph) / 2), since: 9 }));
      }
    }
    // the balls in flight + their bursts (sorted in at the thrower's depth)
    if (balls.length || puffs.length) {
      out.push({ z: L.medallion ? L.medallion.z - 5 : 40, draw: c => {
        balls = balls.filter(b => {
          const u = (t - b.t0) / b.T;
          if (u >= 1) { puffs.push({ x: b.x1, z: b.z1, t0: t }); return false; }
          const x = b.x0 + (b.x1 - b.x0) * u, z = b.z0 + (b.z1 - b.z0) * u, [px, py] = project(cam, x, 1.25 + 2.6 * u * (1 - u) * 2, z), sp = cam.F / z;
          blob(c, px, py, 0.26 * sp, col, 1, true); return true;
        });
        puffs = puffs.filter(p => {
          const v = t - p.t0; if (v > 0.6) return false;
          const [px, py] = project(cam, p.x, 1.0, p.z), sp = cam.F / p.z;
          for (let i = 0; i < 8; i++) { const a = i / 8 * 6.2832; blob(c, px + Math.cos(a) * (0.2 + 1.0 * v) * sp, py + Math.sin(a) * (0.12 + 0.55 * v) * sp, 0.2 * sp * (1 - v), col, 1 - v / 0.6, i % 2 === 0); }
          return true;
        });
      } });
    }
    return out;
  }
  return { items, debug: () => ({ balls: balls.length, puffs: puffs.length }) };
}
