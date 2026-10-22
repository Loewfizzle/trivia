// CITY 2.0 — THE HARBOR, Part 3: THE NEON — the city's signs and the neon outlines on its buildings (docs/harbor.md#neon).
//
//   layout(L)   the spots + tonight's games (core/harbor-neon.js), the signs (signs.js), the outlines projected and CUT where a
//               nearer building stands in front (the occluders' top envelope, per group), all queued as small build steps
//   pump(ms)    builds a few sprites a frame (never a blocked frame); a sign or an outline shows once its sprites are built
//   glass(x, it, T)  the outlines' unlit glass, drawn right after its building in the facade bake (so nearer things cover it)
//   draw(c, group, …) every frame: the far group (the middle tier, the far threads, the glass towers' LED facades) after the far
//               lit windows; the near group (the heroes, the word towers' frames, the quay's signs) after the near ones
//   power       City 1.0's: the neon plan's per-sign states (title.js → S.signPower), each item with its sputter-on / stutter-off,
//               its tubes one by one; a rare flicker; a faint flutter of the core
//   moments     hooks for later parts, previewed now with &force=: party (chasers + the beat + colour shifts), flash (a game's
//               colours sweeping across the skyline: Lobby 2.0's start), scheme (holidays, CITY CONTROL)
import { outlines, signSpots, assignSigns, nightKey, roleColour, SCHEMES, depthStrength, HAZE } from '../../core/harbor-neon.js';
import { project } from '../../core/harbor-layout.js';
import { skyItems } from './skyline.js';
import { tube, drawLit, drawGlass, caps, sprite, bbox, free, mix, rgba } from './tubes.js';
import { buildSign, buildBillboard, billboardContent, signName, SIGN_ACC, drawHousing } from './signs.js';
import { hexRgb, markFor } from '../district/marks.js';
import { showItems, showFrame, newShowOut, FX, everyday, signMotion, nightStage, rotateMix, burnout, burnoutFlicker } from '../../core/harbor-show.js';
// NEON PASS 4: the racing light's head (white-hot) and the shimmer's glints
const HOT = [255, 250, 244];
// the party's colour sweep: each building's second colour (one that contrasts with its own main colour)
const SWEEP = [[255, 46, 151], [46, 230, 255], [168, 82, 255], [255, 210, 90], [255, 40, 210], [24, 232, 190]];
// the colour-cycling sign's colours (the everyday motion): pink → cyan → gold → violet
const CYCLE = [[255, 60, 170], [46, 230, 255], [255, 206, 84], [168, 82, 255]];
const WHITE3 = [255, 255, 255];

const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const THIN = 0.52;                                 // the Deco fins, ledges, trims: finer tubes than the bold outline (Part 4; NEON PASS 3: finer)
const lineK = ln => (ln.needle ? 1.5 : ln.thin ? THIN : 1);
// a cut run's light: dimmer toward its two electrodes (like any open tube), the rest as the whole tube had it
const capLight = lv => lv.map((v, i) => { const e = Math.min(i, lv.length - 1 - i); return e < 4 ? v * (0.62 + 0.095 * e) : v; });

export function createNeon({ games: allGames = [], onContent = () => {} } = {}) {
  const games = allGames.filter(g => g.playable !== false).map(g => ({ ...g, short: signName(g) }));
  let L = null, cam = null, dpr = 1, tier = 2, W = 0;
  let signs = [], boards = [], outs = [], items = [], queue = [], key = '', scheme = 'city', assignKey = '';
  let built = 0, lastOn = false, mbSprites = 0, rev = 0;
  const comp = { far: null, near: null, harbor: null };   // tier 0: each group's lit neon as one image (when it is steady)
  const moment = { party: 0, flash: null, chase: false, scene: null, burnout: false };
  let glassFaces = [], pending = null;
  // NEON PASS 3: THE PARTY SHOW (core/harbor-show.js) — the cast (the items' descriptors, per layout), this frame's plan; THE
  // EVERYDAY MOTION (tonight's blinking / spelling signs, the colour-cycling sign, the slow chasers)
  let castOf = null, cast = [], showOut = newShowOut(0), showOn = false, daily = null, dailyKey = '';
  // A BURNT-OUT LETTER (core/harbor-show.js#burnout): tonight's dead letter, picked from the night's date (or &force=burnout)
  let burn = null, burnKey = '';
  const showState = { lights: 0, sparkle: 0, big: 0, drop: 0, scene: '', moving: 0, peak: 0, punch: 0, beams: 0, shimmer: 0, racing: 0 };
  // NEON PASS 4: THE PARTY SCHEME — on a party night the outlines are re-lit in the bold party colours (rebuilt a few a frame,
  // left → right: the colour rolls across the skyline as the party starts); an explicit scheme (a holiday, a preview) wins
  let schemeX = null, partyLook = false;

  // ---------------------------------------------------------------- the layout
  function layout(l, o) {
    L = l; cam = l.cam; W = cam.W; dpr = Math.min(2, o.dpr || 1); tier = o.tier ?? 2;
    // A re-layout never blanks the neon: the current set keeps drawing (and keeps its power) until the new one is built, then
    // they swap (like the baker's layers). A re-layout during a build drops the half-built set.
    if (pending) { for (const it of pending.items) freeItem(it); pending = null; }
    const old = { signs, boards, outs, items, glassFaces };
    queue = []; items = []; signs = []; boards = []; outs = []; built = 0;
    const spots = signSpots(L);
    assignKey = o.night || assignKey || 'x';
    const pick = assignSigns(games, spots, assignKey);
    const s = cam.F / 600;
    // the signs (named, icons, the fixed ones); the billboards
    for (const sp of spots) {
      const roofY = sp.mount === 'roof' || sp.mount === 'tower' ? roofUnder(sp) : 0;
      if (sp.kind === 'billboard') {
        // tonight's billboard advertises a game that has no named sign tonight (an icon one), never the one up the street
        const named = new Set(spots.filter(x => x.kind === 'named').map(x => pick.get(x.id)));
        const ad = games.filter(g => !named.has(g.id)), show = ad.length ? ad[(boards.length + assignKey.length + assignKey.charCodeAt(assignKey.length - 1)) % ad.length].id : sp.show;
        boards.push({ ...buildBillboard(sp, billboardContent({ game: show }, games), { dpr, roofY }), roofY, item: true }); continue;
      }
      const g = sp.kind === 'fixed' ? null : games.find(x => x.id === pick.get(sp.id));
      if (sp.kind !== 'fixed' && !g) continue;
      signs.push(buildSign(sp, g, { W, s, roofY, frame: frameOf(sp) }));
    }
    // the outlines, projected + cut (the far group and the near group: each against its own nearer buildings)
    const signRects = new Map();
    for (const sp of spots) if (sp.kind !== 'icon' && sp.w) { if (!signRects.has(sp.host)) signRects.set(sp.host, []); signRects.get(sp.host).push(sp.w); }
    // (NEON PASS 3 — DEPTH: each building's tubes weighted by how far away it stands: core/harbor-neon.js#DEPTH)
    outs = outlines(L, signRects).map(o2 => ({ ...o2, st: depthStrength(o2) }));
    glassFaces = [];
    cutOutlines(); dropStubs();
    // the power items: the signs, the billboards, then each building's outline (the boot-up order: the neon plan's)
    items = [...signs.map(sg => ({ kind: 'sign', sg, id: sg.id })), ...boards.map(b => ({ kind: 'board', b, id: b.id })), ...outs.filter(o2 => o2.runs.length).map(o2 => ({ kind: 'outline', o: o2, id: o2.id }))];
    items.forEach((it, i) => { it.i = i; it.pw = null; it.fl = 0; it.flick = -9; it.ready = false; });
    castOf = null;
    const next = { signs, boards, outs, items, glassFaces };
    for (const it of items) queue.push(() => buildItem(it));
    key = `${assignKey}|${scheme}`;
    dailyKey = '';
    if (!old.items.length) return;
    // keep drawing the old set; the swap is the last step of the build
    ({ signs, boards, outs, items, glassFaces } = old);
    pending = next;
    queue.push(() => {
      const byId = new Map(items.map(it => [it.id, it]));
      for (const it of next.items) { const was = byId.get(it.id); if (was) { it.pw = was.pw; it.fl = was.fl; it.flick = was.flick; } }
      for (const it of items) freeItem(it);
      ({ signs, boards, outs, items, glassFaces } = next);
      pending = null; dropComp();
    });
  }
  // the screen y a roof-mounted sign's scaffold stands on: the highest roof under it, among the near band (a sign on a
  // tower's roof: that roof)
  function roofUnder(sp) {
    const R = sp.rect;
    if (sp.mount === 'tower') return project(cam, 0, sp.w.roof, sp.w.z)[1];
    let y = Infinity;
    for (const b of [...L.bands.find(b => b.id === 'near').blocks, ...L.heroes]) {
      const [a, ty] = project(cam, b.x0, b.h, b.z0), [c] = project(cam, b.x1, 0, b.z0);
      if (c > R.x + R.w * 0.15 && a < R.x + R.w * 0.85 && ty > R.y + R.h - 1) y = Math.min(y, ty);
    }
    return y === Infinity ? R.y + R.h + 8 : y;
  }

  // ---------------------------------------------------------------- the outlines: project + cut
  // a tower's roof sign (Part 5): its steel frame on screen — the legs on the roof's edges, the beacon's post on top
  function frameOf(sp) {
    if (sp.mount !== 'tower') return null;
    const w = sp.w, P = (x, y) => project(cam, x, y, w.z);
    return { roofY: P(0, w.roof)[1], legs: w.legs.map(x => P(x, 0)[0]), beacon: P(w.beacon[0], w.beacon[1]), host: sp.host };
  }
  function silhouette(b) {
    const y0 = b.y0 || 0, y1 = y0 + b.h, [a, ty] = project(cam, b.x0, y1, b.z0), [c] = project(cam, b.x1, y0, b.z0);
    let x0 = a, x1 = c;
    if (b.x1 < 0) x1 = Math.max(x1, project(cam, b.x1, 0, b.z1)[0]);
    if (b.x0 > 0) x0 = Math.min(x0, project(cam, b.x0, 0, b.z1)[0]);
    const segs = [[x0, x1, ty]];
    if (b.crown) { const s = cam.F / b.z0, cw = (c - a) * 0.36, cx = (a + c) / 2; segs.push([cx - cw, cx + cw, ty - b.crown.h * s * 0.5]); }
    return segs;
  }
  // NEON PASS 2: what stands IN FRONT of every building's neon besides the nearer buildings — the signs' cabinets, the icons, the
  // billboards (SOLID: a tube never runs through one; its glow is clipped out at draw), the WHEEL's disc (a quiet zone: the tubes
  // behind it end at caps beside the rim), the screen's edges (a tube never runs off the screen: it ends at a cap just inside)
  function blockersOf() {
    const rs = [...signs.map(sg => sg.rect), ...boards.map(b => b.rect)].filter(Boolean).map(r => ({ x0: r.x - 1.4, x1: r.x + r.w + 1.4, y0: r.y - 1.4, y1: r.y + r.h + 1.4 }));
    const w = L.wheel, [wx, wy] = project(cam, w.x, w.y, w.z), wr = cam.F * w.r / w.z * 1.08 + 3;
    return { rs, wheel: { x: wx, y: wy, r2: wr * wr } };
  }
  /** the envelope dilated by r px: a gap narrower than 2r between the roofs in front never lets a tube down into it */
  function dilate(env, r) {
    const out = new Float32Array(env.length);
    for (let x = 0; x < env.length; x++) { let m = env[x]; for (let d = 1; d <= r; d++) { if (x - d >= 0 && env[x - d] < m) m = env[x - d]; if (x + d < env.length && env[x + d] < m) m = env[x + d]; } out[x] = m; }
    return out;
  }
  function cutOutlines() {
    const groups = skyItems(L);
    const K = cam.F / 600, R = Math.max(3, Math.round(5 * K)), EDGE = 2.5, minLen = 5 * K, bl = blockersOf();
    // (NEON PASS 3: + 'harbor' — the lighthouse + the cottage, in open water: nothing of the skyline stands in front of them, and no
    // sign of the skyline cuts them)
    for (const g of ['far', 'near', 'harbor']) {
      const env = new Float32Array(Math.ceil(W) + 2).fill(1e9);
      const ev = [], sky = g !== 'harbor';
      for (const it of groups[g] || []) if (it.b) ev.push({ z: it.b.z0, b: it.b });
      // (each line at its own depth: a band's threads belong to many buildings — each roofline is cut by what stands in front of
      // ITS building, never by its own block)
      for (const o2 of outs) if (o2.group === g) { o2.runs = []; for (const ln of o2.lines) ev.push({ z: (ln.z != null ? ln.z : o2.z) - 0.04, o: o2, ln }); }
      ev.sort((a, b) => a.z - b.z || (a.o ? -1 : 1));
      for (const e of ev) {
        if (e.b) { for (const [x0, x1, y] of silhouette(e.b)) for (let x = Math.max(0, Math.floor(x0)); x <= Math.min(env.length - 1, Math.ceil(x1)); x++) if (y < env[x]) env[x] = y; continue; }
        const o2 = e.o, runs = o2.runs, envD = dilate(env, o2.band ? 1 : R);   // (the dilation keeps a TOWER's edge out of narrow gaps; a band's rooflines need none)
        for (const ln of [e.ln]) {
          const z0 = ln.pts[0][2];
          const pts = ln.pts.map(([x, y, z]) => project(cam, x, y, z ?? z0));
          const tb = tube(pts, !!ln.closed, o2.st.w * (cam.F / 600) * lineK(ln), [false, false]);
          // keep the runs above the (dilated) envelope — what nearer buildings leave visible — and clear of the signs, the wheel and
          // the screen's edges; every run ENDS at an electrode cap (never mid-air, never on behind a building); the light of each
          // point kept from the whole tube
          let run = null;
          tb.pts.forEach(([x, y], i) => {
            const xi = Math.round(x);
            let vis = x >= EDGE && x <= W - EDGE && (xi < 0 || xi >= env.length || y < envD[xi] - 0.4);
            if (vis && sky) for (const r of bl.rs) if (x > r.x0 && x < r.x1 && y > r.y0 && y < r.y1) { vis = false; break; }
            if (vis && sky && (x - bl.wheel.x) ** 2 + (y - bl.wheel.y) ** 2 < bl.wheel.r2) vis = false;
            // (each run keeps its PART — contour, roof, ledge, fin, trim, crown — its level and its building: the party show plays them)
            if (vis) { if (!run) { run = { pts: [], lv: [], role: ln.role, needle: !!ln.needle, thin: !!ln.thin, block: ln.block, part: ln.part || (ln.thin ? 'fin' : 'contour'), lvl: ln.lvl || 0 }; runs.push(run); } run.pts.push([x, y]); run.lv.push(tb.lv[i]); }
            else run = null;
          });
        }

        // the glass towers' LED facades: the face's visible part (above the nearer buildings) for the per-frame glow
        if (e.ln === o2.lines[0] && o2.strength === 'far' && L.towers.find(t => t.id === o2.id && t.rank === 'modern')) {
          const t = L.towers.find(tt => tt.id === o2.id), tr = t.tiers[0], [a, ty] = project(cam, tr.x0, tr.h, tr.z0), [c, by] = project(cam, tr.x1, 0, tr.z0);
          const top = [];
          for (let x = Math.floor(a); x <= Math.ceil(c); x++) top.push([x, Math.min(by, env[Math.max(0, Math.min(env.length - 1, x))])]);
          glassFaces.push({ id: o2.id, x0: a, x1: c, y0: ty, y1: by, floor: top, seed: t.seed });
        }
      }
    }
  }

  // ---------------------------------------------------------------- building the sprites (queued: a few a frame)
  function dropStubs() {
    const K = cam.F / 600, minLen = 5 * K;
    const lenOf = r => { let d = 0; for (let i = 1; i < r.pts.length; i++) d += Math.hypot(r.pts[i][0] - r.pts[i - 1][0], r.pts[i][1] - r.pts[i - 1][1]); return d; };
    for (const o2 of outs) o2.runs = (o2.runs || []).filter(r => r.pts.length > 1 && lenOf(r) >= minLen * (r.thin ? 1.6 : 1));
  }
  function buildItem(it) {
    if (it.kind === 'sign') { it.lit = it.sg.lit(dpr); it.housing = null; }
    else if (it.kind === 'board') { it.night = it.b.nightS; }
    else {
      const o2 = it.o, k = cam.F / 600;
      const tubes = o2.runs.map(r => ({ pts: r.pts, lv: capLight(r.lv), closed: false, ends: [true, true], role: r.role, needle: r.needle, thin: r.thin, part: r.part, lvl: r.lvl, block: r.block }));
      const byRole = new Map();
      for (const t of tubes) { const kk = `${t.role}|${t.needle ? 1 : t.thin ? 2 : 0}`; if (!byRole.has(kk)) byRole.set(kk, []); byRole.get(kk).push(t); }
      const b = bbox(tubes), glow = o2.st.glow * k;
      it.lit = [sprite(b, glow * 2.6, dpr, x => {
        for (const [kk, ts] of byRole) {
          const [role, nd] = kk.split('|');
          const tw = o2.st.w * k * (nd === '1' ? 1.5 : nd === '2' ? THIN : 1);
          drawLit(x, ts, colOf(role, o2), { w: tw, glow: glow * (nd === '1' ? 1.6 : nd === '2' ? 0.7 : 1), a: o2.st.a * (nd === '2' ? 0.85 : 1), dpr, soft: o2.st.soft });
          caps(x, ts, tw, 0);
        }
        // SOLID SIGNS, baked: the signs' + billboards' cabinets cut out of the outline's light once, here (the per-frame clip
        // cost a slow phone ~0.6 ms a frame); only the live chasers + the flash still draw through the clip
        x.globalCompositeOperation = 'destination-out'; x.globalAlpha = 1; x.fillStyle = '#000';
        for (const r of solidRects(o2.group)) x.fillRect(r.x - 0.5, r.y - 0.5, r.w + 1, r.h + 1);
        x.globalCompositeOperation = 'source-over';
      })];
      it.tubes = tubes;
      free(it.alt); it.alt = null; it.altQ = false;
      if (it.vars) { for (const v of it.vars.values()) free(v); it.vars = null; }
      // the party show's live runs (screen pt): the ledges bottom → top, the fins left → right, the crowns, the chase (the whole
      // outline but the thin details)
      const P2 = r => { const p = new Path2D(); p.moveTo(r.pts[0][0], r.pts[0][1]); for (let i = 1; i < r.pts.length; i++) p.lineTo(r.pts[i][0], r.pts[i][1]); return p; };
      const yOf = r => r.pts.reduce((a, p) => a + p[1], 0) / r.pts.length, xOf = r => r.pts.reduce((a, p) => a + p[0], 0) / r.pts.length;
      const fx = (part, key, rev) => tubes.filter(r => r.part === part).map(r => ({ p: P2(r), role: r.role, thin: r.thin, k: key(r) })).sort((a, b) => (rev ? b.k - a.k : a.k - b.k));
      it.fx = { ledges: fx('ledge', yOf, true), fins: fx('fin', xOf), crown: fx('crown', yOf), chase: tubes.filter(r => !r.thin || r.part === 'trim').map(r => ({ p: P2(r), role: r.role, thin: r.thin })) };
      // (NEON PASS 4: THE RACING LIGHT — the whole outline as one path per colour role: a few strokes a building, not one a run)
      const byR = new Map();
      for (const r of tubes) if (!r.thin || r.part === 'trim') { if (!byR.has(r.role)) byR.set(r.role, new Path2D()); const p = byR.get(r.role); p.moveTo(r.pts[0][0], r.pts[0][1]); for (let j = 1; j < r.pts.length; j++) p.lineTo(r.pts[j][0], r.pts[j][1]); }
      it.fx.race = [...byR].map(([role, p]) => ({ role, p }));
      // (the shimmer's glints: a few points along the tubes)
      // (at most 28 a building, spread along its tubes — chosen once here: the shimmer's cost is per glint)
      { const all = []; for (const r of tubes) for (let j = 0; j < r.pts.length; j += 2) all.push(r.pts[j]); const st = Math.max(1, Math.ceil(all.length / 28)); it.glints = all.filter((_, j) => j % st === 0).map((p, j) => [p[0], p[1], j * 2.7 + it.i]); }
      let sx = 0, n = 0; for (const r of tubes) for (const p of r.pts) { sx += p[0]; n++; }
      it.cx = n ? sx / n / W : 0.5;
    }
    it.ready = true; built++;
    mbSprites = items.reduce((s, x) => s + (x.lit ? x.lit.reduce((a, sp) => a + sp.mb, 0) : 0) + (x.night ? x.night.mb : 0), 0);
  }
  function freeItem(it) { if (it.lit) it.lit.forEach(free); free(it.night); if (it.b) free(it.b.nightS); free(it.alt); if (it.cyc) it.cyc.forEach(free); if (it.vars) for (const v of it.vars.values()) free(v); it.lit = null; it.night = null; it.alt = null; it.cyc = null; it.vars = null; }
  // a tube's colour at its building's depth: the far ones sink toward the night haze (aerial perspective)
  const colOf = (role, o2) => { const c = roleColour(role, scheme); return o2 && o2.st && o2.st.haze ? mix(c, HAZE, o2.st.haze) : c; };
  // THE CAST (the party show): one descriptor per outline item, in the items' order (the show's arrays are indexed by item)
  function castFor() {
    if (castOf === items && cast.length === items.length) return cast;
    const kindOf = o2 => (o2.strength === 'hero' || o2.strength === 'pano' ? 'hero' : o2.strength === 'word' ? 'word' : o2.strength === 'mid' ? 'mid' : o2.strength === 'band' || o2.strength === 'midband' ? 'band' : o2.strength === 'quay' ? (o2.group === 'harbor' ? 'harbor' : 'quay') : 'far');
    cast = showItems(items.map(it => (it.kind === 'outline' ? { kind: kindOf(it.o), x: it.cx ?? 0.5, ledges: it.fx ? it.fx.ledges.length : 0, fins: it.fx ? it.fx.fins.length : 0, crown: !!(it.fx && it.fx.crown.length), contour: !!(it.fx && it.fx.chase.length) } : { kind: 'sign', x: 0.5 })));
    if (items.every(it => it.ready)) castOf = items;
    showOut = newShowOut(items.length);
    return cast;
  }
  // a building's party colour: its tubes in one bright colour that contrasts with its own (built a few a frame while the party runs)
  function buildAlt(it) {
    if (!it.tubes || it.alt) return;
    const own = roleColour(it.o.roles[0], scheme), k = cam.F / 600, o2 = it.o;
    let col = SWEEP[(it.i * 2) % SWEEP.length];
    for (let j = 0; j < SWEEP.length && Math.hypot(col[0] - own[0], col[1] - own[1], col[2] - own[2]) < 160; j++) col = SWEEP[(it.i * 2 + j + 1) % SWEEP.length];
    const b = bbox(it.tubes), glow = o2.st.glow * k;
    it.alt = sprite(b, glow * 2.6, dpr, x => {
      drawLit(x, it.tubes, mix(col, HAZE, o2.st.haze || 0), { w: o2.st.w * k, glow, a: o2.st.a, dpr, soft: o2.st.soft });
      x.globalCompositeOperation = 'destination-out'; x.fillStyle = '#000';
      for (const r of solidRects(o2.group)) x.fillRect(r.x - 0.5, r.y - 0.5, r.w + 1, r.h + 1);
    });
    it.altCol = col;
  }
  // a building's tubes in one of the night's colours (SWEEP[i]), built once a frame's queue allows (null meanwhile: its own colours)
  function varSprite(it, key) {
    if (!key || key === 'base') return null;
    it.vars = it.vars || new Map();
    if (it.vars.has(key)) return it.vars.get(key);
    it.vars.set(key, null);
    queue.push(() => {
      if (!it.tubes || !it.vars) return;
      const o2 = it.o, k = cam.F / 600, col = mix(SWEEP[+key.slice(1) % SWEEP.length], HAZE, o2.st.haze || 0), b = bbox(it.tubes), glow = o2.st.glow * k;
      it.vars.set(key, sprite(b, glow * 2.6, dpr, x => {
        drawLit(x, it.tubes, col, { w: o2.st.w * k, glow, a: o2.st.a, dpr, soft: o2.st.soft });
        x.globalCompositeOperation = 'destination-out'; x.fillStyle = '#000';
        for (const r of solidRects(o2.group)) x.fillRect(r.x - 0.5, r.y - 0.5, r.w + 1, r.h + 1);
      }));
    });
    return null;
  }
  // the burnt-out letter's sign text: the dead letter cut out (its unlit glass shows from the housing), a weak sputter now and then
  function deadText(c, it, s, a, dm, t) {
    const bx = it.sg.letterBoxes[burn.letter];
    if (!bx) { c.globalAlpha = Math.min(1, a); c.drawImage(s.c, s.x, s.y, s.w, s.h); return; }
    c.save(); c.beginPath(); c.rect(s.x - 4, s.y - 4, s.w + 8, s.h + 8); c.rect(bx.x0, bx.y0, bx.x1 - bx.x0, bx.y1 - bx.y0); c.clip('evenodd');
    if (dm === 'spell' || dm === 'blink') signText(c, it, s, a, dm, t); else { c.globalAlpha = Math.min(1, a); c.drawImage(s.c, s.x, s.y, s.w, s.h); }
    c.restore();
    const fl = burnoutFlicker(t);
    if (fl > 0.01) { c.save(); c.beginPath(); c.rect(bx.x0, bx.y0, bx.x1 - bx.x0, bx.y1 - bx.y0); c.clip(); c.globalAlpha = Math.min(1, a * fl); c.drawImage(s.c, s.x, s.y, s.w, s.h); c.restore(); }
  }
  // the colour-cycling sign (the everyday motion): its mark in each of the cycle's colours (built once a night)
  function buildCycle(it) {
    if (it.cyc || !it.sg) return;
    const ts = it.sg.parts.filter(p => p.mark || it.sg.type === 'icon').flatMap(p => p.t), w = (it.sg.parts[0] || {}).w || 1;
    if (!ts.length) return;
    const b = bbox(ts), glow = Math.max(3, w * 5.5);
    it.cyc = CYCLE.map(col => sprite(b, glow * 2.6, dpr, x => drawLit(x, ts, col, { w, glow, a: 1, dpr })));
  }
  /**
   * The signs' HOUSINGS + the billboards' painted boards, baked with the facades (static per look: the cabinets, brackets,
   * scaffolds, the unlit glass): one bake step at the end of a group (nothing nearer stands in front of a sign: tested).
   * The set being built after a re-layout is the one the new bake draws.
   */
  function housingStep(group, T) {
    return x => {
      const set = pending || { signs, boards };
      for (const sg of set.signs) if (groupOf(sg.spot) === group) drawHousing(x, sg, T, { roofY: sg.spot.mount === 'roof' || sg.spot.mount === 'tower' ? roofUnder(sg.spot) : 0, frame: sg.frame });
      for (const b of set.boards) if (groupOf(b.spot) === group) { x.save(); b.dayDraw(x, T); x.restore(); }
    };
  }
  /** the scheme the outlines wear now: an explicit one (a holiday, a preview), else the party's on a party night, else the city's */
  function applyScheme() {
    const want = schemeX || (partyLook ? 'party' : 'city');
    if (want === scheme) return;
    scheme = want; dropComp();
    // (rebuilt left → right, a few a frame: the new colours roll across the skyline)
    const outl = items.filter(it => it.kind === 'outline').sort((a, b) => (a.cx ?? 0.5) - (b.cx ?? 0.5));
    for (const it of outl) queue.push(() => { if (!it.tubes && !it.o) return; const old = it.lit; buildItem(it); if (old) old.forEach(free); });
  }
  function pump(ms) {
    if (!queue.length) return false;
    const t0 = performance.now();
    do { queue.shift()(); } while (queue.length && performance.now() - t0 < ms);
    return true;
  }

  // ---------------------------------------------------------------- the outlines' unlit glass (in the facade bake)
  /** after a building is drawn in the facade bake: its outline's glass (day: clear glass catching the sun; night: dark) */
  function glass(x, it, T) {
    if (!L || T.night > 0.9) return;
    const b = it.b, o = it.o || {};
    let o2 = null, lines = null;
    const os = pending ? pending.outs : outs;
    if (b.tower && (o.tierIndex || 0) === 0) o2 = os.find(q => q.id === b.tower);
    else if (b.kind === 'hero') o2 = os.find(q => q.id === b.id);
    else if (b.band === 'near') { o2 = os.find(q => q.band === 'near' && q.blocks && q.blocks.includes(b.id)); lines = o2 && o2.lines.filter(ln => ln.block === b.id); }
    if (!o2 || o2.group !== 'near') return;
    const k = cam.F / 600, w = o2.st.w * k;
    const ls = lines || o2.lines;
    if (!ls.length || !o2.runs) return;
    const byRole = new Map();
    const rs = lines ? o2.runs.filter(r => r.block === b.id) : o2.runs;
    for (const r of rs) { const t = { pts: r.pts, lv: r.lv, closed: false, ends: [true, true] }; const kk = `${r.role}|${r.needle ? 1 : r.thin ? 2 : 0}`; if (!byRole.has(kk)) byRole.set(kk, []); byRole.get(kk).push(t); }
    for (const [kk, ts] of byRole) {
      const [role, nd] = kk.split('|');
      if (nd === '1') { x.strokeStyle = rgba(mix([30, 26, 40], [120, 116, 120], T.day + T.gold)); x.lineWidth = Math.max(0.4, w * 0.5); x.beginPath(); for (const t of ts) { x.moveTo(t.pts[0][0] + w * 0.6, t.pts[0][1]); x.lineTo(t.pts.at(-1)[0] + w * 0.6, t.pts.at(-1)[1]); } x.stroke(); }
      drawGlass(x, ts, roleColour(role, scheme), T, { w: w * (nd === '1' ? 1.5 : nd === '2' ? THIN : 1), clipEvery: 30, faint: true });
    }
  }

  // ---------------------------------------------------------------- power (City 1.0's timing)
  function powerTick(t, S, P) {
    const on = (P.sign || 0) > 0.5 && (S.bill ?? 1) > 0.4;
    const n = items.length, spacing = Math.min(0.6, 4.5 / Math.max(1, n));
    if (S.signPower) {
      // THE NEON COMES ALIVE: one item at a time, each with its own sputter-on / stutter-off (once the title's boot reached them)
      items.forEach((it, i) => { const want = !!S.signPower[i % S.signPower.length] && (S.bill ?? 1) > 0.4; if (!it.pw || it.pw.on !== want) it.pw = { on: want, t0: t + (want && !lastOn ? 0.25 + i * spacing : 0.05) }; });
      lastOn = items.some(it => it.pw.on);
    } else if (on !== lastOn || items.some(it => !it.pw)) {
      lastOn = on;
      items.forEach((it, i) => { if (!it.pw || it.pw.on !== on) it.pw = { on, t0: t + (on ? 0.25 + i * spacing : Math.random() * 0.25) }; });
    }
    if (S.motion && tier > 0) for (const it of items) if (t > it.fl) { if (it.fl) it.flick = t; it.fl = t + 25 + Math.random() * 45; }
  }
  // City 1.0's segAlpha: tube by tube at dusk (and at the boot), all off together at dawn, a rare small flicker
  function alpha(it, i, t, motion) {
    if (!it.pw) return 0;
    let a;
    const e = t - it.pw.t0;
    if (!motion) a = it.pw.on ? clamp01((e - i * 0.05) / 0.4) : 1 - clamp01(e / 0.4);
    else if (it.pw.on) { const q = e - i * 0.16; a = q < 0 ? 0 : q < 0.03 ? 1 : q < 0.07 ? 0.15 : q < 0.11 ? 0.9 : q < 0.14 ? 0.3 : 1; }
    else { const q = e - i * 0.03; a = q < 0 ? 1 : q < 0.05 ? 0.3 : q < 0.09 ? 0.85 : q < 0.13 ? 0.1 : 0; }
    if (motion && t - it.flick < 0.32) { const q = t - it.flick; a *= q < 0.05 ? 0.35 : q < 0.1 ? 1 : q < 0.15 ? 0.5 : 1; }
    return clamp01(a);
  }

  // ---------------------------------------------------------------- per frame
  let dot = null;
  const warmDot = () => { if (dot) return dot; const c = document.createElement('canvas'); c.width = c.height = 32; const x = c.getContext('2d'), g = x.createRadialGradient(16, 16, 0, 16, 16, 16); g.addColorStop(0, 'rgba(255,244,214,1)'); g.addColorStop(0.25, 'rgba(255,214,150,0.7)'); g.addColorStop(1, 'rgba(255,190,110,0)'); x.fillStyle = g; x.fillRect(0, 0, 32, 32); return (dot = c); };
  /**
   * Draw a group's neon. f: { t (s), now, night (0..1: how dark), fade (the city's fade-in), motion, tier, party (PT), force }
   */
  function draw(c, group, f) {
    if (!L) return;
    const t = f.t, motion = f.motion, flutter = motion && tier > 1;      // (tier 1: no core flutter — Part 4's budget)
    c.save();
    c.globalCompositeOperation = 'lighter';
    // (tier 0, the calm city: the party's motion — the chasers, the beat — is dropped; the neon stays lit, steady)
    const pe = f.party ? f.party.ramp * (f.party.energy || 0) : 0, partyK = tier === 0 ? 0 : Math.max(pe, moment.party);
    // THE PARTY SCHEME (every tier: the still picture is a party too) — on above 0.3, off under 0.15
    if (group === 'far') { const pl = Math.max(pe, moment.party); const want = partyLook ? pl > 0.15 : pl > 0.3; if (want !== partyLook) { partyLook = want; applyScheme(); } }
    // tonight's burnt-out letter (the night's date; the named signs; a forced preview)
    { const bk = `${assignKey}|${signs.length}|${moment.burnout ? 1 : 0}`; if (bk !== burnKey) { burnKey = bk; const m = /^(\d+)-(\d+)-(\d+)$/.exec(assignKey); burn = m ? burnout({ y: +m[1], m: +m[2], d: +m[3] }, signs.filter(sg => sg.kind === 'named' && sg.nText).map(sg => ({ id: sg.id, n: sg.nText })), moment.burnout) : null; dropComp(); } }
    // tonight's everyday motion (once every item is built; a new pick each night)
    if (group === 'far' && dailyKey !== `${assignKey}|${items.length}` && items.length && items.every(it => it.ready)) { dailyKey = `${assignKey}|${items.length}`; castOf = null; castFor(); daily = everyday(assignKey, cast, signs.map(sg => ({ id: sg.id, kind: sg.kind, edge: !!sg.rect && (sg.rect.x < 36 * cam.F / 600 || sg.rect.x + sg.rect.w > W - 36 * cam.F / 600) }))); }
    // THE PARTY SHOW (NEON PASS 3): this frame's plan, once a frame (the far group draws first)
    if (group === 'far') planShow(f, partyK);
    // the glass towers' LED facades (far): slow, smooth colour gradients sweeping across the face (a calm night: subtle)
    if (group === 'far' && f.night > 0.05 && tier > 1) for (const gf of glassFaces) ledFacade(c, gf, t, f, partyK);
    else if (group === 'far' && f.night > 0.05 && tier === 1 && glassFaces.length) ledStill(c, f, partyK);
    // TIER 0 (the calm city): once the group's neon is steady (all on, the boot done, no moment running) it is one image
    if (tier === 0 && f.spelling && f.spelling.length) for (const it of items) dimOf(it, f);
    if (tier === 0 && steady(group, t, partyK)) {
      if (!comp[group]) comp[group] = composite(group);
      // (tier 0 on a party night: no moving effects — the whole neon breathes gently on the beat as one image)
      // (NEON PASS 4: the hard beat, as one image: 0.85 between beats → ~1.3 on the beat — the part over 1 drawn again, additive)
      const pb = f.party && motion ? 0.85 + 0.5 * (f.party.punch || 0) : 1;
      if (comp[group]) { const cp = comp[group], base = f.fade * (group === 'far' ? Math.max(0.05, f.night) : 1); c.globalAlpha = Math.min(1, base * pb); c.drawImage(cp.c, cp.x, cp.y, cp.w, cp.h); if (pb > 1.01) { c.globalAlpha = Math.min(1, base * (pb - 1)); c.drawImage(cp.c, cp.x, cp.y, cp.w, cp.h); } boardsLit(c, group, t, motion, f); }
      c.restore();
      return;
    }
    if (comp[group] && tier > 0) dropComp();
    // THE OUTLINES FIRST (+ the moments over them), the signs' cabinets clipped out — SOLID signs: no tube or glow shows through
    // a sign, an icon or a billboard (NEON PASS 2) — then the signs on top
    drawItems(c, group, f, t, motion, flutter, partyK, true);
    // the live light over the tubes: the party show's effects (+ the &force=neon-party / chase previews), tonight's slow chasers,
    // a game's flash — through the solid-sign clip (only while something runs)
    // (tonight's slow chasers: tier 2 only — tier 1 keeps the signs' blink / spell / colour cycle, which cost nothing)
    const live = motion && tier > 0 && (showOn || moment.chase || (daily && daily.chase.size && f.night > 0.3));
    if (live || moment.flash) {
      c.save(); solidClip(c, group);
      if (live) liveFx(c, group, t, f);
      if (motion && tier > 1 && f.night > 0.3 && !(f.force && f.force.has('no-shimmer'))) shimmerFx(c, group, t, f);   // (tier 2 only: the A-B-B-A's one fix)
      if (moment.flash) flashSweep(c, group, f);
      c.restore();
    }
    drawItems(c, group, f, t, motion, flutter, partyK, false);
    c.restore();
  }
  /** the clip that keeps the outlines' light out of the signs (even-odd: the screen minus each sign's cabinet) */
  const solidRects = group => [...signs.filter(sg => groupOf(sg.spot) === group).map(sg => sg.rect), ...boards.filter(b => groupOf(b.spot) === group).map(b => b.rect)].filter(Boolean);
  function solidClip(c, group) {
    const rs = solidRects(group);
    if (!rs.length) return;
    c.beginPath(); c.rect(-100, -100, W + 200, 1e4);
    for (const r of rs) c.rect(r.x - 0.5, r.y - 0.5, r.w + 1, r.h + 1);
    c.clip('evenodd');
  }
  function drawItems(c, group, f, t, motion, flutter, partyK, outlinesPass) {
    const noPunch = !!(f.force && f.force.has('no-punch'));        // (&force=no-punch: the perf A/B of the punch's second draw)
    for (const it of items) {
      if (!it.ready || (!it.lit && it.kind !== 'board')) continue;
      if ((it.kind === 'outline') !== outlinesPass) continue;
      if (it.kind === 'outline') { if (it.o.group !== group) continue; }
      else if (groupOf(it.kind === 'sign' ? it.sg.spot : it.b.spot) !== group) continue;
      const base = f.fade * (flutter ? 0.965 + 0.035 * Math.sin(t * 11 + it.i * 2.3) * Math.sin(t * 3.1 + it.i) : 1) * dimOf(it, f);
      if (it.kind === 'board') {
        const a = alpha(it, 0, t, motion) * base * f.night;
        if (a > 0.01 && it.night) { c.globalCompositeOperation = 'source-over'; c.globalAlpha = a; c.drawImage(it.night.c, it.night.x, it.night.y, it.night.w, it.night.h); c.globalCompositeOperation = 'lighter'; }
        continue;
      }
      // THE PARTY SHOW: the building's tubes × the plan (the beat, call-and-response), its party colour crossfaded in by a sweep;
      // under a live effect (a climb, the fins, a chase) the tubes sink back a little so the running light reads
      let beat = 1, alt = 0;
      // (NEON PASS 4: the signs + icons punch on the beat too — their light and glow, never the billboards' paint)
      if (it.kind === 'sign' && showOn) beat = 0.9 + 0.55 * showState.punch;
      if (it.kind === 'outline' && showOn) {
        const fx = showOut.fx[it.i];
        beat = showOut.a[it.i] * (showOut.race[it.i] > 0.05 ? 0.82 : 1) * (fx === FX.ledges || fx === FX.fins ? 0.72 : 1);
        alt = showOut.alt[it.i];
        if (alt > 0.02 && !it.alt && !it.altQ) { it.altQ = true; queue.push(() => buildAlt(it)); }
        if (!it.alt) alt = 0;
      }
      // COLOURS THROUGH THE NIGHT (not during the party's show): a slow ROTATION to the building's second colour and back, or
      // the building's SCHEME for the night's stage (evening → late night → the small hours), crossfaded over 20 s
      let vk = null;
      if (it.kind === 'outline' && !showOn && daily && tier > 0 && it.tubes) {
        if (daily.rotate.has(it.i) && motion) { const m = rotateMix(t, it.i); if (m > 0.004) { if (!it.alt && !it.altQ) { it.altQ = true; queue.push(() => buildAlt(it)); } if (it.alt) { alt = m; } } }
        else if (daily.stages.has(it.i) && f.hour != null) {
          const ci = daily.stages.get(it.i)[nightStage(f.hour)], key = ci < 0 ? 'base' : `v${ci}`;
          if (it.stCur !== key) { it.stPrev = it.stCur || 'base'; it.stCur = key; it.stT0 = it.stT0 == null || !motion ? -1e9 : t; }
          const k2 = motion ? Math.min(1, Math.max(0, (t - it.stT0) / 20)) : 1;
          vk = { from: varSprite(it, it.stPrev), to: varSprite(it, it.stCur), k: k2 * k2 * (3 - 2 * k2) };
        }
      }
      // THE EVERYDAY MOTION on the signs: a name that blinks or spells itself on, the colour-cycling sign
      const dm = it.kind === 'sign' && daily && motion && tier > 0 ? (daily.spell.has(it.sg.id) ? 'spell' : daily.blink.has(it.sg.id) ? 'blink' : daily.cycle === it.sg.id ? 'cycle' : null) : null;
      it.lit.forEach((s, i) => {
        let a = alpha(it, i, t, motion) * base * beat;
        if (a <= 0.01) return;
        // (a BURNT-OUT LETTER: the sign's text drawn with that letter cut out — dark glass — and a weak sputter now and then)
        if (s.role === 'text' && burn && burn.id === it.sg.id) { deadText(c, it, s, a, dm, t); return; }
        if (dm && s.role === 'text' && (dm === 'spell' || dm === 'blink')) { signText(c, it, s, a, dm, t); return; }
        if (dm === 'cycle' && (s.role === 'mark' || it.sg.type === 'icon')) { if (!it.cyc) buildCycle(it); if (it.cyc) { cycleDraw(c, it, a, t); return; } }
        if (alt > 0) { c.globalAlpha = Math.min(1, a * (1 - alt)); c.drawImage(s.c, s.x, s.y, s.w, s.h); c.globalAlpha = Math.min(1, a * alt * 1.1); c.drawImage(it.alt.c, it.alt.x, it.alt.y, it.alt.w, it.alt.h); if (a > 1.01) { const A = alt > 0.5 ? it.alt : s; c.globalAlpha = Math.min(1, a - 1); c.drawImage(A.c, A.x, A.y, A.w, A.h); } return; }
        if (vk && i === 0) { const A = vk.from || s, B = vk.to || s; if (vk.k < 1) { c.globalAlpha = Math.min(1, a * (1 - vk.k)); c.drawImage(A.c, A.x, A.y, A.w, A.h); } c.globalAlpha = Math.min(1, a * vk.k); c.drawImage(B.c, B.x, B.y, B.w, B.h); return; }
        c.globalAlpha = Math.min(1, a); c.drawImage(s.c, s.x, s.y, s.w, s.h);
        // THE PUNCH: brighter than lit — the sprite again, additive (its core + glow swell together)
        if (a > 1.01 && !noPunch) { c.globalAlpha = Math.min(1, a - 1); c.drawImage(s.c, s.x, s.y, s.w, s.h); }
      });
      // the game blade's chaser bulbs (Part 6a; the HOTEL's before)
      if (it.kind === 'sign' && it.sg.bulbs) {
        const a = alpha(it, 0, t, motion) * base;
        // (NEON PASS 3: a CALM chase on the outer frame — one bulb in four, a step every 0.42 s, a soft hand-off between them; never a
        // flash across the letters)
        // (NEON PASS 4, the party: a MARQUEE — a step every beat, one bulb in three, the lit ones punching)
        const pt = showOn && f.party ? f.party : null, pp = pt ? showState.punch : 0;
        if (a > 0.02) { const D = warmDot(), u = !motion ? 0 : pt ? (pt.beats || 0) + Math.min(1, (pt.beatU || 0) * 4) : t / 0.42, step = Math.floor(u), fr = u - step, m = pt ? 3 : 4; it.sg.bulbs.forEach(([bx, by], i) => { const ph = (i + step) % m, lit = ph === 0 ? 1 - fr * 0.6 : ph === m - 1 ? 0.4 + fr * 0.6 : 0; c.globalAlpha = Math.min(1, a * (0.3 + 0.7 * lit) * (1 + 0.6 * pp * lit)); const r = 1.35 + 0.65 * lit + 0.8 * pp * lit; c.drawImage(D, bx - r, by - r, r * 2, r * 2); }); }
      }
    }
  }
  const groupOf = sp => (sp.z >= 300 ? 'far' : 'near');
  // A TOWER SPELLING A WORD: its roof sign sinks to a low glow (over ~1 s) so the message is the star, and comes back after
  // (f.spelling: the towers spelling now — lights.spelling.towers)
  const SPELL_DIM = 0.22;
  function dimOf(it, f) {
    if (it.kind !== 'sign' || it.sg.spot.mount !== 'tower') return 1;
    const want = f.spelling && f.spelling.includes(it.sg.spot.host) ? SPELL_DIM : 1;
    const k = f.motion ? Math.min(1, (f.dt || 16.7) / 900) * 3 : 1;
    it.dim = it.dim == null ? want : it.dim + (want - it.dim) * Math.min(1, k);
    if (Math.abs(it.dim - want) < 0.004) it.dim = want;
    return it.dim;
  }
  const inGroup = (it, group) => (it.kind === 'outline' ? it.o.group : groupOf(it.kind === 'sign' ? it.sg.spot : it.b.spot)) === group;
  function steady(group, t, partyK) {
    if (items.some(it => it.kind === 'sign' && it.sg.spot.mount === 'tower' && it.dim != null && it.dim !== 1 && inGroup(it, group))) return false;
    if (partyK > 0.05 || moment.flash || queue.length) return false;
    for (const it of items) if (inGroup(it, group) && (!it.ready || !it.pw || !it.pw.on || t - it.pw.t0 < 2.5)) return false;
    return true;
  }
  // the group's lit sprites (signs + outlines; the game blade's bulbs steady) composed once into one canvas
  function composite(group) {
    const sps = items.filter(it => inGroup(it, group) && it.lit).flatMap(it => it.lit);   // (the bounds; drawn in two passes below)
    if (!sps.length) return null;
    const x0 = Math.max(0, Math.min(...sps.map(s => s.x))), y0 = Math.min(...sps.map(s => s.y)), x1 = Math.min(W, Math.max(...sps.map(s => s.x + s.w))), y1 = Math.max(...sps.map(s => s.y + s.h));
    return sprite({ x0, y0, x1, y1 }, 0, dpr, x => {
      x.globalCompositeOperation = 'lighter';
      if (group === 'far') for (const gf of glassFaces) ledFacade(x, gf, 0, { motion: false, night: 1, fade: 1 }, 0);   // (the LED facades, still)
      // (the outlines under the signs' cabinets clipped out, then the signs: SOLID)
      x.save(); solidClip(x, group);
      for (const it of items) if (inGroup(it, group) && it.lit && it.kind === 'outline') for (const s of it.lit) x.drawImage(s.c, s.x, s.y, s.w, s.h);
      x.restore();
      for (const it of items) if (inGroup(it, group) && it.lit && it.kind !== 'outline') for (const s of it.lit) {
        const bx = burn && it.sg && burn.id === it.sg.id && s.role === 'text' ? it.sg.letterBoxes[burn.letter] : null;
        if (bx) { x.save(); x.beginPath(); x.rect(s.x - 4, s.y - 4, s.w + 8, s.h + 8); x.rect(bx.x0, bx.y0, bx.x1 - bx.x0, bx.y1 - bx.y0); x.clip('evenodd'); x.drawImage(s.c, s.x, s.y, s.w, s.h); x.restore(); }
        else x.drawImage(s.c, s.x, s.y, s.w, s.h);
      }
      const D = warmDot();
      for (const it of items) if (inGroup(it, group) && it.kind === 'sign' && it.sg.bulbs) it.sg.bulbs.forEach(([bx, by], i) => { x.globalAlpha = i % 4 === 0 ? 1 : 0.3; const r = i % 4 === 0 ? 2 : 1.35; x.drawImage(D, bx - r, by - r, r * 2, r * 2); });
    });
  }
  function dropComp() { for (const g of ['far', 'near', 'harbor']) { free(comp[g]); comp[g] = null; } free(led.sp); led.sp = null; led.key = ''; }
  // tier 1 (Part 4's budget): the LED facades held still — one cached image of their gradients (the party's colours or the calm
  // ones), drawn with the night's strength; the slow sweep + the climbing band run at tier 2 only
  const led = { key: '', sp: null };
  function ledStill(c, f, partyK) {
    const key = `${partyK > 0.3 ? 1 : 0}|${glassFaces.length}`;
    if (key !== led.key || !led.sp) {
      free(led.sp); led.key = key;
      const b = { x0: Math.min(...glassFaces.map(g => g.x0)), y0: Math.min(...glassFaces.map(g => g.y0)), x1: Math.max(...glassFaces.map(g => g.x1)), y1: Math.max(...glassFaces.map(g => g.y1)) };
      led.sp = sprite(b, 0, dpr, x => { x.globalCompositeOperation = 'lighter'; for (const gf of glassFaces) ledFacade(x, gf, 0, { motion: false, night: 1, fade: 1 }, partyK > 0.3 ? 1 : 0); });
    }
    const a = f.night * f.fade;
    if (a > 0.01 && led.sp) { c.globalAlpha = a; c.drawImage(led.sp.c, led.sp.x, led.sp.y, led.sp.w, led.sp.h); c.globalAlpha = 1; }
  }
  function boardsLit(c, group, t, motion, f) {
    for (const it of items) if (it.kind === 'board' && inGroup(it, group) && it.night) { const a = alpha(it, 0, t, motion) * f.fade * f.night; if (a > 0.01) { c.globalCompositeOperation = 'source-over'; c.globalAlpha = a; c.drawImage(it.night.c, it.night.x, it.night.y, it.night.w, it.night.h); } }
  }

  function ledFacade(c, gf, t, f, partyK) {
    const tt = f.motion && tier > 0 ? t : 0, k = f.night * f.fade;
    c.save();
    c.beginPath(); c.moveTo(gf.x0, gf.y0); c.lineTo(gf.x1, gf.y0);
    for (let i = gf.floor.length - 1; i >= 0; i--) c.lineTo(gf.floor[i][0], gf.floor[i][1]);
    c.closePath(); c.clip();
    const h = gf.y1 - gf.y0, ph = (tt / 26 + (gf.seed % 100) / 100) % 1;
    const cols = partyK > 0.3 ? [[255, 46, 151], [46, 230, 255], [168, 82, 255]] : [[46, 200, 255], [120, 90, 255], [46, 123, 255]];
    const g = c.createLinearGradient(0, gf.y0 - h * ph * 2, 0, gf.y0 + h * 2 - h * ph * 2);
    for (let i = 0; i <= 6; i++) g.addColorStop(i / 6, rgba(cols[i % 3], (0.13 + 0.05 * (i % 2)) * k));
    c.fillStyle = g; c.fillRect(gf.x0, gf.y0, gf.x1 - gf.x0, h);
    // a band of light climbing the face, slowly; thin floor lines catching it
    const by = gf.y1 - ((tt / 9 + (gf.seed % 7) / 7) % 1) * h * 1.4;
    const g2 = c.createLinearGradient(0, by - h * 0.12, 0, by + h * 0.12);
    g2.addColorStop(0, 'rgba(200,240,255,0)'); g2.addColorStop(0.5, rgba([200, 240, 255], 0.2 * k)); g2.addColorStop(1, 'rgba(200,240,255,0)');
    c.fillStyle = g2; c.fillRect(gf.x0, by - h * 0.12, gf.x1 - gf.x0, h * 0.24);
    c.fillStyle = rgba([200, 236, 255], 0.06 * k); for (let y = gf.y0 + 2; y < gf.y1; y += Math.max(1.4, h / 40)) c.fillRect(gf.x0, y, gf.x1 - gf.x0, 0.35);
    c.restore();
  }
  // ---------------------------------------------------------------- THE PARTY SHOW + the everyday motion: per frame
  function planShow(f, partyK) {
    const P = f.party, forced = moment.party > 0.05 && !(P && P.ramp > 0.05);
    showOn = !!(tier > 0 && partyK > 0.05 && (P || forced));
    // (tier 0: no live effects, but the show's still cues — the searchlights at the peak, the wheel, the NEON word's big drops)
    if (!showOn && tier === 0 && P && P.ramp > 0.05) {
      castFor();
      showFrame(cast, { bar: P.bar, phase: P.phase, energy: P.energy, ramp: P.ramp, name: P.name, swell: P.swell, tier: 0, motion: f.motion, t: f.t, finale: f.finale, beatU: P.beatU, beatT: P.beatT, beatIdx: P.beatIdx, beats: P.beats, rate: P.rate }, showOut);
      Object.assign(showState, { lights: showOut.lights, sparkle: showOut.sparkle, big: showOut.big, drop: showOut.drop, scene: showOut.scene, moving: 0, peak: showOut.peak, punch: P.punch || 0, beams: showOut.beams, shimmer: 0, racing: 0 });
      return;
    }
    if (!showOn) { showState.lights = 0; showState.sparkle = 0; showState.big = 0; showState.drop = 0; showState.scene = ''; showState.moving = 0; showState.peak = 0; showState.punch = 0; showState.beams = 0; showState.shimmer = 0; showState.racing = 0; return; }
    castFor();
    // (the &force=neon-party preview keeps its own 120 bpm: a beat every 0.5 s, a breath of two)
    const fr = forced ? { bar: Math.floor(f.t), phase: f.t % 1, energy: 1, ramp: moment.party, name: 'peak', swell: 0, beatU: (f.t / 0.5) % 1, beatT: 0.5, beatIdx: Math.floor(f.t / 0.5) % 2, beats: Math.floor(f.t / 0.5), rate: 1 }
      : { bar: P.bar, phase: P.phase, energy: P.energy, ramp: P.ramp, name: P.name, swell: P.swell, beatU: P.beatU, beatT: P.beatT, beatIdx: P.beatIdx, beats: P.beats, rate: P.rate };
    showFrame(cast, { ...fr, tier, motion: f.motion, t: f.t, finale: f.finale, scene: moment.scene }, showOut);
    Object.assign(showState, { lights: showOut.lights, sparkle: showOut.sparkle, big: showOut.big, drop: showOut.drop, scene: showOut.scene, moving: showOut.moving, peak: showOut.peak, punch: showOut.punch, beams: showOut.beams, shimmer: showOut.shimmer, racing: showOut.racing });
  }
  // a run set stroked as live light: a soft glow (tier 2) + a bright core, in each tube's own colour (k: 0..1+)
  function strokeRuns(c, rs, w, k, white = 0.45, o2 = null) {
    for (const r of rs) {
      const col = o2 ? colOf(r.role, o2) : roleColour(r.role, scheme), ww = w * (r.thin ? 1 : 1.1);
      if (tier > 1) { c.strokeStyle = rgba(col, Math.min(1, 0.36 * k)); c.lineWidth = ww * 4.6; c.stroke(r.p); }
      c.strokeStyle = rgba(mix(col, WHITE3, white), Math.min(1, 0.95 * k)); c.lineWidth = ww * 1.3; c.stroke(r.p);
    }
  }
  const bump = (d, wd) => { const v = Math.max(0, 1 - Math.abs(d) / wd); return v * v * (3 - 2 * v); };
  function liveFx(c, group, t, f) {
    c.lineCap = 'round'; c.lineJoin = 'round'; c.globalAlpha = 1; c.setLineDash([]);
    for (const it of items) {
      if (it.kind !== 'outline' || it.o.group !== group || !it.fx || !it.pw || !it.pw.on) continue;
      const w = it.o.st.w * cam.F / 600, pk = alpha(it, 0, t, true) * f.fade;
      if (pk < 0.05) continue;
      let fx = showOn ? showOut.fx[it.i] : 0, k = showOn ? showOut.k[it.i] : 0;
      const ph = showOn ? showOut.ph[it.i] : 0;
      // the &force previews (chase on): every hero / word tower chases
      if (!fx && moment.chase && (it.o.strength === 'hero' || it.o.strength === 'word' || it.o.strength === 'pano')) { fx = FX.chase; k = 1; }
      if (fx === FX.ledges && it.fx.ledges.length) {
        // THE CLIMB: the ledge bands light floor by floor up the tower and fall back (a triangle through the floors)
        const n = it.fx.ledges.length, tri = ph < 0.5 ? ph * 2 : 2 - ph * 2, pos = tri * (n + 0.6) - 0.3;
        it.fx.ledges.forEach((r, j) => { const e = bump(j - pos, 1.4) * k * pk; if (e > 0.03) strokeRuns(c, [r], w, e, 0.45, it.o); });
      } else if (fx === FX.fins && it.fx.fins.length) {
        // THE FINS in sequence: a soft wave running across them (never a hard strobe)
        const n = it.fx.fins.length, pos = ph * (n + 1.5) - 0.75;
        it.fx.fins.forEach((r, j) => { const e = bump(j - pos, 1.2) * k * pk; if (e > 0.03) strokeRuns(c, [r], w, e, 0.45, it.o); });
      } else if (fx === FX.flash && it.fx.crown.length) {
        // A CROWN FLASHING on the drop: a flare easing back
        strokeRuns(c, it.fx.crown, w * 1.15, Math.min(1.4, 1.3 * k) * pk, 0.6, it.o);
      } else if (fx === FX.chase) {
        // (the &force=neon-party preview's old chase: a plain dash)
        c.setLineDash([w * 2.6, w * 4.2]); c.lineDashOffset = -t * 26;
        strokeRuns(c, it.fx.chase, w, Math.min(1, k) * pk, 0.5, it.o);
        c.setLineDash([]);
      }
      // THE RACING LIGHT (NEON PASS 4): pulses racing round the whole outline — the party's (fast, several a tube, surging on the
      // beat) or tonight's slow chasers (one or two a tube, soft; tier 1: the first two)
      const rk = showOn ? showOut.race[it.i] : 0;
      // (&force=no-race: the perf A/B of the racing light)
      if (f.force && f.force.has('no-race')) continue;
      if (rk > 0.03) race(c, it, w, rk * pk, f, true);
      else if (!showOn && daily && daily.chase.has(it.i) && f.night > 0.3 && (tier > 1 || [...daily.chase].indexOf(it.i) < 2)) race(c, it, w, 0.55 * f.night * pk, f, false);
    }
  }
  /**
   * THE RACING LIGHT along a building's whole outline: a dash pattern moving along the pre-built paths (one per colour role) —
   * a soft coloured glow (tier 2), the coloured tail, a hot white HEAD at the leading end. party: fast, a pulse every ~38 pt, its
   * speed surging on the beat, its direction the director's (some reverse every two bars); otherwise: slow, every ~90 pt, soft.
   * The offset is integrated per building, so a reversal never jumps.
   */
  function race(c, it, w, k, f, party) {
    if (!it.fx.race || !it.fx.race.length) return;
    const K = cam.F / 600, dt = Math.min(0.05, (f.dt || 16.7) / 1000);
    const P = (party ? 38 : 92) * K, tail = P * (party ? 0.42 : 0.3), head = Math.max(1.4, w * 1.2);
    const dir = party ? showOut.dir[it.i] || 1 : (it.i % 2 ? 1 : -1);
    const v = party ? (70 + 55 * (showOut.sp[it.i] || 1)) * K * (1 + 1.4 * showState.punch) : 16 * K;
    // (once a frame: the harbor group is drawn twice when the water mirrors it)
    if (it.raceT !== f.t) { it.raceT = f.t; it.raceO = ((it.raceO || 0) - dir * v * dt) % (P * 1000); }
    const o = it.raceO, oHead = dir > 0 ? o - tail + head : o;
    for (const r of it.fx.race) {
      const col = colOf(r.role, it.o);
      c.setLineDash([tail, P - tail]); c.lineDashOffset = o;
      if (tier > 1) { c.strokeStyle = rgba(col, Math.min(1, 0.3 * k)); c.lineWidth = w * (party ? 5.2 : 4); c.stroke(r.p); }
      c.strokeStyle = rgba(mix(col, WHITE3, 0.18), Math.min(1, 0.9 * k)); c.lineWidth = w * 1.6; c.stroke(r.p);
      c.setLineDash([head, P - head]); c.lineDashOffset = oHead;
      c.strokeStyle = rgba(HOT, Math.min(1, (party ? 1 : 0.8) * k)); c.lineWidth = w * (party ? 2 : 1.6); c.stroke(r.p);
    }
    c.setLineDash([]);
  }
  /**
   * THE SHIMMER (NEON PASS 4): a party night — a band of glints rolls across the skyline every ~5 s, sparkling along the tubes it
   * passes and lighting the crowns white-hot; a normal night — now and then (~every 20 s) one crown catches a slow white shimmer.
   */
  function shimmerFx(c, group, t, f) {
    const K = cam.F / 600, D = warmDot();
    if (showOn && showState.shimmer > 0.05) {
      const per = 5.2, u = (t / per) % 1, sx = (u * 1.5 - 0.25) * W, bw = 70 * K;
      let n = 0;
      for (const it of items) {
        if (it.kind !== 'outline' || it.o.group !== group || !it.glints || !it.pw || !it.pw.on) continue;
        const cx = (it.cx ?? 0.5) * W; if (Math.abs(cx - sx) > bw * 2.2) continue;
        const w = it.o.st.w * K;
        if (tier > 1) for (let j = 0; j < it.glints.length && n < 80; j++) {
          const [x, y, sd] = it.glints[j], d = Math.abs(x - sx); if (d > bw) continue;
          const tw = (Math.sin(t * 9 + sd) + 1) * 0.5; if (tw < 0.55) continue;
          const a = (1 - d / bw) * (tw - 0.55) / 0.45 * showState.shimmer * f.fade; if (a < 0.04) continue;
          const r = (1.6 + 2.2 * a) * Math.max(0.8, w);
          c.globalAlpha = Math.min(1, a); c.drawImage(D, x - r, y - r, r * 2, r * 2); n++;
        }
        if (it.fx && it.fx.crown.length) { const e = Math.max(0, 1 - Math.abs(cx - sx) / (bw * 1.4)); if (e > 0.05) { c.globalAlpha = 1; strokeRuns(c, it.fx.crown, w * 1.1, e * 0.9 * showState.shimmer, 0.75, it.o); } }
      }
      c.globalAlpha = 1;
      return;
    }
    if (showOn || !daily) return;
    // a normal night: one crown every ~20 s, a white shimmer running across it (1.6 s)
    const P = 20, slot = Math.floor(t / P), e = t - slot * P;
    if (e > 1.6) return;
    const crowns = items.filter(it => it.kind === 'outline' && it.o.group === group && it.fx && it.fx.crown.length && it.pw && it.pw.on);
    if (!crowns.length) return;
    const all = items.filter(it => it.kind === 'outline' && it.fx && it.fx.crown.length), pick = all[Math.floor(((slot * 2654435761) >>> 0) % 997) % Math.max(1, all.length)];
    if (!pick || !crowns.includes(pick)) return;
    const w = pick.o.st.w * K, k = Math.sin(Math.PI * e / 1.6) * 0.8 * f.night * f.fade;
    c.setLineDash([9 * K, 400 * K]); c.lineDashOffset = 400 * K - e / 1.6 * 120 * K;
    strokeRuns(c, pick.fx.crown, w * 1.2, k, 0.85, pick.o);
    c.setLineDash([]);
  }
  // a sign's name: BLINK (soft off-on twice) or SPELL ON (dark, then its letters strike one by one down / across the sign)
  function signText(c, it, s, a, dm, t) {
    const m = signMotion(dm, t, it.i * 7 + 3);
    if (m.a <= 0.01) return;
    if (m.reveal >= 1) { c.globalAlpha = Math.min(1, a * m.a); c.drawImage(s.c, s.x, s.y, s.w, s.h); return; }
    const n = Math.max(1, it.sg.nText || 4);
    const q = Math.floor(m.reveal * (n + 0.999)) / n, b = s.box || { x0: s.x, y0: s.y, x1: s.x + s.w, y1: s.y + s.h }, vert = it.sg.type === 'vbox';
    if (q <= 0) return;
    c.save(); c.beginPath();
    if (vert) c.rect(s.x - 2, s.y - 2, s.w + 4, b.y0 - s.y + 2 + (b.y1 - b.y0) * q); else c.rect(s.x - 2, s.y - 2, b.x0 - s.x + 2 + (b.x1 - b.x0) * q, s.h + 4);
    c.clip(); c.globalAlpha = Math.min(1, a * m.a); c.drawImage(s.c, s.x, s.y, s.w, s.h); c.restore();
  }
  // THE COLOUR-CYCLING SIGN: its mark drifts pink → cyan → gold → violet, 7 s a colour, a 2 s crossfade
  function cycleDraw(c, it, a, t) {
    const u = (t / 7) % CYCLE.length, i = Math.floor(u), fr = u - i, x = Math.max(0, (fr - 0.72) / 0.28), e = x * x * (3 - 2 * x);
    const A = it.cyc[i], B = it.cyc[(i + 1) % CYCLE.length];
    c.globalAlpha = Math.min(1, a * (1 - e)); c.drawImage(A.c, A.x, A.y, A.w, A.h);
    if (e > 0) { c.globalAlpha = Math.min(1, a * e); c.drawImage(B.c, B.x, B.y, B.w, B.h); }
  }
  function flashSweep(c, group, f) {
    const fl = moment.flash, e = (performance.now() - fl.t0) / 1000;
    if (e > fl.dur + 0.8) { moment.flash = null; return; }
    const front = -80 + (W + 160) * (e / fl.dur);
    c.save(); c.lineCap = 'round'; c.globalAlpha = 1;
    for (const it of items) {
      if (it.kind !== 'outline' || it.o.group !== group || !it.tubes) continue;
      const w = it.o.st.w * cam.F / 600;
      it.tubes.forEach((tb, j) => {
        const x = tb.pts[0][0], d = front - x;
        if (d < 0 || d > 140) return;
        const a = Math.sin(Math.PI * d / 140) * f.fade;
        c.strokeStyle = rgba(fl.cols[(j + it.i) % fl.cols.length], 0.9 * a); c.lineWidth = w * 1.6;
        c.beginPath(); c.moveTo(tb.pts[0][0], tb.pts[0][1]); for (let i = 1; i < tb.pts.length; i++) c.lineTo(tb.pts[i][0], tb.pts[i][1]); c.stroke();
      });
    }
    c.restore();
  }

  return {
    layout, pump, glass, draw, powerTick, housingStep,
    /** tests: each outline's visible runs on screen (after the cut) — { id, z, group, runs: [[[x, y]…]…] } */
    runs: () => outs.map(o2 => ({ id: o2.id, z: o2.z, group: o2.group, runs: o2.runs.map(r => r.pts.map(([x, y]) => [+x.toFixed(1), +y.toFixed(1)])) })),
    /** bumps when a billboard's content changes: the scene re-bakes (the boards are baked with the facades) */
    get rev() { return rev; },
    /** the number of power items (the neon plan's "signs": title.js#neonNow) */
    count: () => items.length || 16,
    get pending() { return queue.length > 0; },
    /** is the neon moving right now (the calm frame rate, scene.js): an item booting or going dark (its sputter), a flicker
     *  within the last third of a second, a moment (party, flash, chase), sprites still building */
    busy(t) {
      if (queue.length || moment.flash || moment.chase || moment.party > 0.05) return true;
      for (const it of items) if (it.pw && t - it.pw.t0 < 2.5) return true;      // (the rare flicker is a dip, not motion)
      return false;
    },
    setTier(t) { tier = t; dropComp(); },
    /** tonight's pick changes only while the neon is dark (never while you watch); key: nightKey(local) */
    night(k) { if (k !== assignKey && !items.some(it => it.pw && it.pw.on)) { assignKey = k; return true; } return false; },
    /** a moment: 'party' (k 0..1: chasers + beat + colour shifts), 'chase' (on/off), 'flash' ({ game } | { cols }: the game's
     *  colours sweep across the skyline), 'scheme' (a name in SCHEMES: the outlines re-lit in it) */
    moment(name, v) {
      if (name === 'party') moment.party = clamp01(+v || 0);
      else if (name === 'chase') moment.chase = !!v;
      else if (name === 'show') moment.scene = v || null;
      else if (name === 'burnout') moment.burnout = !!v;            // (&force=burnout: a dead letter tonight)          // (a party show scene held: the &scene= preview, reviews)
      else if (name === 'flash') { const g = v && v.game && games.find(x => x.id === v.game); const cols = (v && v.cols) || (g ? markFor(g).tubes.map(t => hexRgb(t.col)).concat([hexRgb(SIGN_ACC[g.id] || '#ffffff')]) : [[255, 46, 151], [46, 230, 255]]); moment.flash = { t0: performance.now(), dur: 1.6, cols }; }
      else if (name === 'scheme' && (SCHEMES[v] || v === 'city')) { schemeX = v === 'city' ? null : v; applyScheme(); }
    },
    /** a billboard's content (CITY CONTROL later): { game } or { title, sub, bg, ink } */
    billboard(id, show) {
      const it = items.find(x => x.kind === 'board' && x.id === id); if (!it) return false;
      const b = buildBillboard(it.b.spot, billboardContent(show, games), { dpr, roofY: it.b.roofY });
      const i = boards.indexOf(it.b);
      free(it.night); it.b = { ...b, roofY: it.b.roofY }; it.night = b.nightS; if (i >= 0) boards[i] = it.b;
      dropComp(); rev++; onContent();
      return true;
    },
    /** a tap on a game's sign → { kind: 'sign', id } */
    hit(x, y) {
      for (const sg of signs) { const R = sg.rect; if (sg.game && x >= R.x - 4 && x <= R.x + R.w + 4 && y >= R.y - 4 && y <= R.y + R.h + 4) return { kind: 'sign', id: sg.game, sign: sg.id }; }
      return null;
    },
    /** Part 4's hook: every light that should smear in the water — { x, y, w, h, col, a } on screen */
    reflections: () => items.filter(it => it.ready && it.pw && it.pw.on).map(it => { const R = it.kind === 'sign' ? it.sg.rect : it.kind === 'board' ? it.b.rect : null; if (R) return { id: it.id, x: R.x, y: R.y, w: R.w, h: R.h, col: it.kind === 'sign' ? it.sg.col : [255, 214, 150], a: 1 }; const s = it.lit && it.lit[0]; return s ? { id: it.id, x: s.x, y: s.y, w: s.w, h: s.h, col: roleColour(it.o.roles[0], scheme), a: it.o.st.a } : null; }).filter(Boolean),
    /** NEON PASS 4: the solid signs' rects on screen (a sky beam rises from above the roof sign on its tower) */
    signRects: () => signs.filter(sg => sg.rect).map(sg => sg.rect),
    /** NEON PASS 4: the sky beams' colours — each tower's own neon colour (its party colour while a sweep / strobe holds it) */
    beamCols: ids => ids.map(id => { const it = items.find(x => x.kind === 'outline' && x.id === id); if (!it || !it.o) return [255, 255, 255]; if (showOn && showOut.alt[it.i] > 0.5 && it.altCol) return it.altCol; return roleColour(it.o.roles[0], scheme); }),
    /** the party show's state this frame (the scene reads it: the searchlights, the wheel's sparkle, the NEON word's big drops) */
    show: () => showState,
    /** tonight's everyday motion (debug) */
    daily: () => (daily ? { spell: [...daily.spell], blink: [...daily.blink], cycle: daily.cycle, chase: [...daily.chase].map(i => items[i] && items[i].id), rotate: [...daily.rotate].map(i => items[i] && items[i].id), stages: [...daily.stages.keys()].map(i => items[i] && items[i].id), burnout: burn ? { ...burn } : null } : null),
    debug: () => ({ signs: signs.map(sg => ({ id: sg.id, game: sg.game, kind: sg.kind, type: sg.type, rect: { x: +sg.rect.x.toFixed(1), y: +sg.rect.y.toFixed(1), w: +sg.rect.w.toFixed(1), h: +sg.rect.h.toFixed(1) }, on: !!(items.find(i => i.sg === sg) || {}).pw?.on })), boards: boards.map(b => ({ id: b.id, show: b.content.title })), outlines: outs.map(o2 => ({ id: o2.id, group: o2.group, strength: o2.strength, runs: o2.runs.length, roles: o2.roles })), items: items.length, built, queued: queue.length, mb: +(mbSprites + (comp.far ? comp.far.mb : 0) + (comp.near ? comp.near.mb : 0)).toFixed(2), comp: { far: !!comp.far, near: !!comp.near }, tier, night: assignKey, scheme, led: glassFaces.length, moment: { party: moment.party, chase: moment.chase, flash: !!moment.flash }, partyLook, show: { ...showState } }),
    destroy() { for (const it of [...items, ...(pending ? pending.items : [])]) freeItem(it); items = []; pending = null; queue = []; dropComp(); free({ c: dot }); },
  };
}
export { nightKey };
