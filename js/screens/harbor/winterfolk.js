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
const smooth01 = u => u * u * (3 - 2 * u);

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
  // 9c — THE DOORMAN IN HIS PROPER UNIFORM for the morning round: the long navy coat with brass buttons + a belt, a PEAKED cap, gloves
  const doormanLook = carry => { const k = `door|${carry || ''}`; let l = looks.get(k); if (!l) { const b = lookOf('doorman', 4242, { season: 'winter', cold: true }); l = { ...b, carry, hat: 'peaked', coat: 'long', trim: [222, 184, 98], belt: [30, 26, 30], gloves: [36, 32, 34], scarf: null, cols: { ...b.cols, coat: [40, 46, 92], hat: [34, 38, 74], scarf: null } }; looks.set(k, l); } return l; };
  // the stroke clock (9c): one stroke every STROKE s, the clump leaving at TOSS of it; a shoveller's piles grow with his strokes
  const STROKE = 2.3, TOSS = 0.8;
  let balls = [], puffs = [], lastT = 0;

  /** 9c: a tossed heap of snow (never a ball): three overlapping lumps, breaking up as it flies (k 0..1) */
  function clump(c, x, y, r, col, k) {
    const sp = 0.35 + 0.9 * k;
    blob(c, x, y, r, col); blob(c, x - r * sp, y + r * 0.35 * (1 + k), r * 0.62, col); blob(c, x + r * sp * 0.9, y + r * 0.25, r * 0.5, col, 0.95);
    c.fillStyle = 'rgba(90,100,130,0.35)'; c.beginPath(); c.ellipse(x, y + r * 0.55, r * 0.9, r * 0.28, 0, 0, 6.2832); c.fill();   // (its shaded underside)
  }
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
    // 9c (the owner: "looks a little cheap — needs to look more premium"): in his proper uniform he clears the steps ONE BY ONE — three
    // strokes on each (the top step first, the blade at that step's height), stepping down between them, then the walk before them —
    // and then a WIDE ARC of salt flung across the cleared steps; the cycle repeats each ~60 s while his round lasts
    if (acts.shovel && s) {
      const dx = s.x0 + (s.door.u0 + s.door.u1) / 2, zs = s.z0 - 1.1, cyc = mo ? t % 60 : 20, salting = cyc > 44;
      const n = Math.floor(cyc / STROKE), ph = (cyc / STROKE) % 1, stepI = Math.min(3, Math.floor(n / 3));   // (0, 1, 2: the steps top → bottom; 3: the walk)
      const z = zs - 0.5 * Math.min(stepI, 3), low = [0.24, 0.16, 0.08, 0][stepI];
      const st = salting ? { x: dx + 0.5, z: zs - 0.6, pose: 'point', v: 0, hd: Math.PI * 0.6, dist: 0, a: 1, since: 9, carry: null }
        : { x: dx + 1.15, z, pose: 'shovel', ph, low, v: 0, hd: Math.PI, dist: 0, a: 1, since: 9, carry: 'shovel' };
      out.push({ z: st.z, draw: c => {
        drawFolk(c, cam, { s: st, L: doormanLook(st.carry) }, E);
        if (!mo) return;
        const sp = cam.F / st.z;
        if (!salting) {
          // the clump off the blade on the toss: a big white heap arcing left onto the pile beside the steps
          if (ph > TOSS - 0.04) { const k = clamp01((ph - TOSS + 0.04) / (1 - TOSS + 0.04)); const [ax, ay] = project(cam, st.x - 0.75, 0.75 + low, st.z), [bx, by] = project(cam, dx - 1.9, 0.15, zs - 0.4); clump(c, ax + (bx - ax) * k, ay + (by - ay) * k - Math.sin(k * Math.PI) * 0.7 * sp, 0.24 * sp, col, k); }
        } else {
          // the WIDE ARC of salt: his arm sweeping, the grains flung out in a fan that spreads across the steps + falls
          const u0 = (cyc - 44) / 16;
          c.fillStyle = 'rgb(236,234,226)';
          for (let i = 0; i < 40; i++) { const a = -0.9 + 1.8 * ((i * 0.618) % 1), u = (u0 * 4 + i * 0.137) % 1, [px, py] = project(cam, st.x + Math.cos(a) * 2.6 * u - 0.6, 1.2 * (1 - u) * (1 - u) + 0.05, st.z + Math.sin(a) * 0.9 * u); c.globalAlpha = 0.95 * (1 - u * 0.7); const r = Math.max(0.7, 0.05 * sp); c.fillRect(px, py, r, r); }
          c.globalAlpha = 1;
        }
      } });
      // the pile he builds beside the steps (grows through the round)
      out.push({ z: zs - 0.4, draw: c => { const [px, py] = project(cam, dx - 1.9, 0, zs - 0.4), sp = cam.F / (zs - 0.4), k = salting ? 1 : clamp01(n / 12); if (k > 0.05) { c.fillStyle = col; c.beginPath(); c.ellipse(px, py - 0.12 * sp * k, (0.5 + 0.35 * k) * sp, 0.3 * sp * k + 0.5, 0, Math.PI, 0); c.fill(); c.fillStyle = 'rgba(70,80,110,0.35)'; c.fillRect(px - (0.5 + 0.35 * k) * sp, py - 0.5, (1 + 0.7 * k) * sp, 1); } } });
    }
    // ---- A SHOVELLER working slowly along the front walk (left → right over two hours), clumps tossed toward the curb
    // 9c (the owner: he must MOVE "back and forth like he's actually shovelling"): the full stroke (folk.js 'shovel'), a step forward between
    // strokes (pushing along the walk to the right), each toss a heap arcing onto the growing pile toward the curb; the CLEARED strip
    // (the wet dark stone) growing behind him. Forced: a 70-s pass from the left; live: across the walk over the two hours.
    if (acts.shoveller && L.edge) {
      const zF = (L.impliedOn !== false ? L.edge.z + L.edge.curbW : L.impliedRoad.z0) + 1.6, hw = cam.hw(zF);
      const h = w.lc ? w.lc.h + w.lc.mi / 60 : 10, forced = !!(w.force && w.force.has('shovel'));
      const x0 = -hw * 0.7, span = hw * 1.4, STEP = 0.55;
      const tt = mo ? (forced ? t % 90 : (h - 9) * 3600) : 30, n = Math.floor(tt / STROKE), ph = (tt / STROKE) % 1;
      const xs = x0 + Math.min(span, (n + smooth01(clamp01((ph - 0.86) / 0.14))) * STEP);   // (the step forward between strokes)
      const done = forced ? false : (h - 9) * 3600 / STROKE * STEP > span;
      if (!done) {
        const st = { x: xs, z: zF, pose: 'shovel', ph, low: 0, v: 0, hd: 0, dist: 0, a: 1, since: 9, carry: 'shovel' };
        out.push(fig('worker', 777, st, c => {
          if (!mo || ph < TOSS - 0.04) return;
          const k = clamp01((ph - TOSS + 0.04) / (1 - TOSS + 0.04)), sp = cam.F / zF;
          const [ax, ay] = project(cam, xs + 0.7, 0.8, zF), [bx, by] = project(cam, xs + 0.4, 0.1, zF - 1.1);
          clump(c, ax + (bx - ax) * k, ay + (by - ay) * k - Math.sin(k * Math.PI) * 0.8 * sp, 0.24 * sp, col, k);
          if (k > 0.85) for (let i = 0; i < 5; i++) blob(c, bx + (i - 2) * 0.16 * sp, by - (0.1 + 0.05 * (i % 2)) * sp, 0.09 * sp, col, 1 - (k - 0.85) * 5);   // (the spray where it lands)
        }));
      }
      // the CLEARED strip behind him (bare wet stone) + the pile ridge he throws toward the curb, both growing with his strokes
      const xe = done ? x0 + span : xs - 0.3;
      if (xe > x0 + 0.1) out.push({ z: zF + 0.8, draw: c => {
        const P = (x, z) => project(cam, x, 0, z);
        const a = P(x0, zF + 0.7), b = P(xe, zF + 0.7), c2 = P(xe, zF - 0.6), d = P(x0, zF - 0.6);
        c.fillStyle = `rgba(${w.wetCol || '108,100,100'},0.78)`; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.lineTo(c2[0], c2[1]); c.lineTo(d[0], d[1]); c.closePath(); c.fill();
        c.fillStyle = 'rgba(255,255,255,0.12)'; c.fillRect(Math.min(a[0], d[0]), (a[1] + d[1]) / 2, b[0] - a[0], 1);   // (its wet sheen)
      } });
      if (xe > x0 + 0.1) out.push({ z: zF - 1.1, draw: c => {
        const sp = cam.F / (zF - 1.1); c.fillStyle = col; c.beginPath();
        const [ax, ay] = project(cam, x0, 0, zF - 1.1), [bx] = project(cam, xe + 0.6, 0, zF - 1.1);
        c.moveTo(ax, ay); for (let i = 0; i <= 12; i++) { const u = i / 12, x = ax + (bx - ax) * u; c.lineTo(x, ay - (0.18 + 0.1 * Math.sin(u * 17)) * sp); } c.lineTo(bx, ay); c.closePath(); c.fill();
        c.fillStyle = 'rgba(70,80,110,0.3)'; c.fillRect(ax, ay - 1, bx - ax, 1.2);
      } });
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
        out.push(fig('walker', 5131, { x: m.x + 1.75, z: m.z - 0.15, pose: 'reach', v: 0, hd: Math.PI, dist: 0, a: 1, since: 9 }));   // (9c: BESIDE him — behind, his raised arms read as the snowman's)
      } else if (w.sm.progress >= 0.93 && h >= 9 && h < 17) {
        const P = 360, ph = t % P, n = Math.floor(t / P);
        if (ph < 50) out.push(n % 2 ? fig('kid', 5200 + (n % 5), { x: m.x - 1.55, z: m.z - 0.7, pose: 'reach', v: 0, hd: 0.2, dist: 0, a: Math.min(1, ph / 2, (50 - ph) / 2), since: 9 })
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
