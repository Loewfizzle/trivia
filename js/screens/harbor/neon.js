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
import { outlines, signSpots, assignSigns, nightKey, roleColour, STRENGTH, SCHEMES } from '../../core/harbor-neon.js';
import { project } from '../../core/harbor-layout.js';
import { skyItems } from './skyline.js';
import { tube, drawLit, drawGlass, sprite, bbox, free, mix, rgba } from './tubes.js';
import { buildSign, buildBillboard, billboardContent, signName, SIGN_ACC, drawHousing } from './signs.js';
import { hexRgb, markFor } from '../district/marks.js';

const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const THIN = 0.6;                                  // the Deco fins: thinner tubes than the contour (Part 4)
const lineK = ln => (ln.needle ? 1.5 : ln.thin ? THIN : 1);

export function createNeon({ games: allGames = [], onContent = () => {} } = {}) {
  const games = allGames.filter(g => g.playable !== false).map(g => ({ ...g, short: signName(g) }));
  let L = null, cam = null, dpr = 1, tier = 2, W = 0;
  let signs = [], boards = [], outs = [], items = [], queue = [], key = '', scheme = 'city', assignKey = '';
  let built = 0, lastOn = false, mbSprites = 0, rev = 0;
  const comp = { far: null, near: null };          // tier 0: each group's lit neon as one image (when it is steady)
  const moment = { party: 0, flash: null, chase: false };
  let glassFaces = [], pending = null;

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
      const roofY = sp.mount === 'roof' ? roofUnder(sp) : 0;
      if (sp.kind === 'billboard') {
        // tonight's billboard advertises a game that has no named sign tonight (an icon one), never the one up the street
        const named = new Set(spots.filter(x => x.kind === 'named').map(x => pick.get(x.id)));
        const ad = games.filter(g => !named.has(g.id)), show = ad.length ? ad[(boards.length + assignKey.length + assignKey.charCodeAt(assignKey.length - 1)) % ad.length].id : sp.show;
        boards.push({ ...buildBillboard(sp, billboardContent({ game: show }, games), { dpr, roofY }), roofY, item: true }); continue;
      }
      const g = sp.kind === 'fixed' ? null : games.find(x => x.id === pick.get(sp.id));
      if (sp.kind !== 'fixed' && !g) continue;
      signs.push(buildSign(sp, g, { W, s, roofY }));
    }
    // the outlines, projected + cut (the far group and the near group: each against its own nearer buildings)
    const signRects = new Map();
    for (const sp of spots) if (sp.kind !== 'icon' && sp.w) { if (!signRects.has(sp.host)) signRects.set(sp.host, []); signRects.get(sp.host).push(sp.w); }
    outs = outlines(L, signRects).map(o2 => ({ ...o2, st: STRENGTH[o2.strength] || STRENGTH.mid }));
    glassFaces = [];
    cutOutlines();
    // the power items: the signs, the billboards, then each building's outline (the boot-up order: the neon plan's)
    items = [...signs.map(sg => ({ kind: 'sign', sg, id: sg.id })), ...boards.map(b => ({ kind: 'board', b, id: b.id })), ...outs.filter(o2 => o2.runs.length).map(o2 => ({ kind: 'outline', o: o2, id: o2.id }))];
    items.forEach((it, i) => { it.i = i; it.pw = null; it.fl = 0; it.flick = -9; it.ready = false; });
    const next = { signs, boards, outs, items, glassFaces };
    for (const it of items) queue.push(() => buildItem(it));
    key = `${assignKey}|${scheme}`;
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
  // the screen y a roof-mounted sign's scaffold stands on: the highest roof under it, among the near band
  function roofUnder(sp) {
    const R = sp.rect;
    let y = Infinity;
    for (const b of [...L.bands.find(b => b.id === 'near').blocks, ...L.heroes]) {
      const [a, ty] = project(cam, b.x0, b.h, b.z0), [c] = project(cam, b.x1, 0, b.z0);
      if (c > R.x + R.w * 0.15 && a < R.x + R.w * 0.85 && ty > R.y + R.h - 1) y = Math.min(y, ty);
    }
    return y === Infinity ? R.y + R.h + 8 : y;
  }

  // ---------------------------------------------------------------- the outlines: project + cut
  function silhouette(b) {
    const y0 = b.y0 || 0, y1 = y0 + b.h, [a, ty] = project(cam, b.x0, y1, b.z0), [c] = project(cam, b.x1, y0, b.z0);
    let x0 = a, x1 = c;
    if (b.x1 < 0) x1 = Math.max(x1, project(cam, b.x1, 0, b.z1)[0]);
    if (b.x0 > 0) x0 = Math.min(x0, project(cam, b.x0, 0, b.z1)[0]);
    const segs = [[x0, x1, ty]];
    if (b.crown) { const s = cam.F / b.z0, cw = (c - a) * 0.36, cx = (a + c) / 2; segs.push([cx - cw, cx + cw, ty - b.crown.h * s * 0.5]); }
    return segs;
  }
  function cutOutlines() {
    const groups = skyItems(L);
    for (const g of ['far', 'near']) {
      const env = new Float32Array(Math.ceil(W) + 2).fill(1e9);
      const ev = [];
      for (const it of groups[g]) if (it.b) ev.push({ z: it.b.z0, b: it.b });
      for (const o2 of outs) if (o2.group === g) ev.push({ z: o2.z - 0.04, o: o2 });
      ev.sort((a, b) => a.z - b.z || (a.o ? -1 : 1));
      for (const e of ev) {
        if (e.b) { for (const [x0, x1, y] of silhouette(e.b)) for (let x = Math.max(0, Math.floor(x0)); x <= Math.min(env.length - 1, Math.ceil(x1)); x++) if (y < env[x]) env[x] = y; continue; }
        const o2 = e.o, runs = [];
        for (const ln of o2.lines) {
          const z0 = ln.pts[0][2];
          const pts = ln.pts.map(([x, y, z]) => project(cam, x, y, z ?? z0));
          const tb = tube(pts, !!ln.closed, o2.st.w * (cam.F / 600) * lineK(ln), [false, false]);
          // keep the runs above the envelope (what nearer buildings leave visible); the light of each point kept from the whole
          let run = null;
          tb.pts.forEach(([x, y], i) => {
            const xi = Math.round(x), vis = x >= -4 && x <= W + 4 && (xi < 0 || xi >= env.length || y < env[xi] - 0.4);
            if (vis) { if (!run) { run = { pts: [], lv: [], role: ln.role, needle: !!ln.needle, thin: !!ln.thin, block: ln.block }; runs.push(run); } run.pts.push([x, y]); run.lv.push(tb.lv[i]); }
            else run = null;
          });
        }
        o2.runs = runs.filter(r => r.pts.length > 1);
        // the glass towers' LED facades: the face's visible part (above the nearer buildings) for the per-frame glow
        if (o2.strength === 'far' && L.towers.find(t => t.id === o2.id && t.rank === 'modern')) {
          const t = L.towers.find(tt => tt.id === o2.id), tr = t.tiers[0], [a, ty] = project(cam, tr.x0, tr.h, tr.z0), [c, by] = project(cam, tr.x1, 0, tr.z0);
          const top = [];
          for (let x = Math.floor(a); x <= Math.ceil(c); x++) top.push([x, Math.min(by, env[Math.max(0, Math.min(env.length - 1, x))])]);
          glassFaces.push({ id: o2.id, x0: a, x1: c, y0: ty, y1: by, floor: top, seed: t.seed });
        }
      }
    }
  }

  // ---------------------------------------------------------------- building the sprites (queued: a few a frame)
  function buildItem(it) {
    if (it.kind === 'sign') { it.lit = it.sg.lit(dpr); it.housing = null; }
    else if (it.kind === 'board') { it.night = it.b.nightS; }
    else {
      const o2 = it.o, k = cam.F / 600;
      const tubes = o2.runs.map(r => ({ pts: r.pts, lv: r.lv, closed: false, ends: [false, false], role: r.role, needle: r.needle, thin: r.thin }));
      const byRole = new Map();
      for (const t of tubes) { const kk = `${t.role}|${t.needle ? 1 : t.thin ? 2 : 0}`; if (!byRole.has(kk)) byRole.set(kk, []); byRole.get(kk).push(t); }
      const b = bbox(tubes), glow = o2.st.glow * k;
      it.lit = [sprite(b, glow * 2.6, dpr, x => {
        for (const [kk, ts] of byRole) {
          const [role, nd] = kk.split('|');
          drawLit(x, ts, roleColour(role, scheme), { w: o2.st.w * k * (nd === '1' ? 1.5 : nd === '2' ? THIN : 1), glow: glow * (nd === '1' ? 1.6 : nd === '2' ? 0.7 : 1), a: o2.st.a * (nd === '2' ? 0.85 : 1), dpr });
        }
      })];
      it.tubes = tubes;
    }
    it.ready = true; built++;
    mbSprites = items.reduce((s, x) => s + (x.lit ? x.lit.reduce((a, sp) => a + sp.mb, 0) : 0) + (x.night ? x.night.mb : 0), 0);
  }
  function freeItem(it) { if (it.lit) it.lit.forEach(free); free(it.night); it.lit = null; }
  /**
   * The signs' HOUSINGS + the billboards' painted boards, baked with the facades (static per look: the cabinets, brackets,
   * scaffolds, the unlit glass): one bake step at the end of a group (nothing nearer stands in front of a sign: tested).
   * The set being built after a re-layout is the one the new bake draws.
   */
  function housingStep(group, T) {
    return x => {
      const set = pending || { signs, boards };
      for (const sg of set.signs) if (groupOf(sg.spot) === group) drawHousing(x, sg, T, { roofY: sg.spot.mount === 'roof' ? roofUnder(sg.spot) : 0 });
      for (const b of set.boards) if (groupOf(b.spot) === group) { x.save(); b.dayDraw(x, T); x.restore(); }
    };
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
    else if (b.band === 'near') { o2 = os.find(q => q.id === 'threads-near'); lines = o2 && o2.lines.filter(ln => ln.block === b.id); }
    if (!o2 || o2.group !== 'near') return;
    const k = cam.F / 600, w = o2.st.w * k;
    const ls = lines || o2.lines;
    if (!ls.length) return;
    const byRole = new Map();
    for (const ln of ls) { const z0 = ln.pts[0][2]; const t = tube(ln.pts.map(([xx, y, z]) => project(cam, xx, y, z ?? z0)), false, w, [false, false]); const kk = `${ln.role}|${ln.needle ? 1 : ln.thin ? 2 : 0}`; if (!byRole.has(kk)) byRole.set(kk, []); byRole.get(kk).push(t); }
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
    const t = f.t, motion = f.motion, flutter = motion && tier > 0;
    c.save();
    c.globalCompositeOperation = 'lighter';
    // (tier 0, the calm city: the party's motion — the chasers, the beat — is dropped; the neon stays lit, steady)
    const pe = f.party ? f.party.ramp * (f.party.energy || 0) : 0, partyK = tier === 0 ? 0 : Math.max(pe, moment.party);
    // the glass towers' LED facades (far): slow, smooth colour gradients sweeping across the face (a calm night: subtle)
    if (group === 'far' && f.night > 0.05 && tier > 0) for (const gf of glassFaces) ledFacade(c, gf, t, f, partyK);
    // TIER 0 (the calm city): once the group's neon is steady (all on, the boot done, no moment running) it is one image
    if (tier === 0 && steady(group, t, partyK)) {
      if (!comp[group]) comp[group] = composite(group);
      if (comp[group]) { const cp = comp[group]; c.globalAlpha = f.fade * (group === 'far' ? Math.max(0.05, f.night) : 1); c.drawImage(cp.c, cp.x, cp.y, cp.w, cp.h); boardsLit(c, group, t, motion, f); }
      c.restore();
      return;
    }
    if (comp[group] && tier > 0) dropComp();
    for (const it of items) {
      if (!it.ready || (!it.lit && it.kind !== 'board')) continue;
      if (it.kind === 'outline') { if (it.o.group !== group) continue; }
      else if (groupOf(it.kind === 'sign' ? it.sg.spot : it.b.spot) !== group) continue;
      const base = f.fade * (flutter ? 0.965 + 0.035 * Math.sin(t * 11 + it.i * 2.3) * Math.sin(t * 3.1 + it.i) : 1);
      if (it.kind === 'board') {
        const a = alpha(it, 0, t, motion) * base * f.night;
        if (a > 0.01 && it.night) { c.globalCompositeOperation = 'source-over'; c.globalAlpha = a; c.drawImage(it.night.c, it.night.x, it.night.y, it.night.w, it.night.h); c.globalCompositeOperation = 'lighter'; }
        continue;
      }
      // the beat (party nights): the outlines breathe with the music at the peak
      // (while the chasers run, the tubes under them sink back so the running light reads)
      const chasing = it.kind === 'outline' && motion && tier > 0 && (moment.chase || partyK > 0.05) && (it.o.strength === 'hero' || it.o.strength === 'word' || it.o.strength === 'pano');
      const beat = (it.kind === 'outline' && partyK > 0 ? 0.82 + 0.3 * partyK * (f.party ? f.party.breath : 0.5 + 0.5 * Math.sin(t * 6.4)) : 1) * (chasing ? 0.45 : 1);
      it.lit.forEach((s, i) => {
        const a = alpha(it, i, t, motion) * base * beat;
        if (a <= 0.01) return;
        c.globalAlpha = Math.min(1, a); c.drawImage(s.c, s.x, s.y, s.w, s.h);
      });
      // the HOTEL's chaser bulbs
      if (it.kind === 'sign' && it.sg.bulbs) {
        const a = alpha(it, 0, t, motion) * base;
        if (a > 0.02) { const D = warmDot(), step = motion ? Math.floor(t / 0.16) : 0; it.sg.bulbs.forEach(([bx, by], i) => { const lit = (i + step) % 3 === 0; c.globalAlpha = a * (lit ? 1 : 0.28); const r = lit ? 2.6 : 1.6; c.drawImage(D, bx - r, by - r, r * 2, r * 2); }); }
      }
    }
    // MOMENTS over the outlines: party chasers, the game's flash sweeping across the skyline
    if (motion && tier > 0 && (partyK > 0.05 || moment.chase)) chasers(c, group, t, Math.max(partyK, moment.chase ? 1 : 0), f);
    if (moment.flash) flashSweep(c, group, f);
    c.restore();
  }
  const groupOf = sp => (sp.z >= 300 ? 'far' : 'near');
  const inGroup = (it, group) => (it.kind === 'outline' ? it.o.group : groupOf(it.kind === 'sign' ? it.sg.spot : it.b.spot)) === group;
  function steady(group, t, partyK) {
    if (partyK > 0.05 || moment.flash || queue.length) return false;
    for (const it of items) if (inGroup(it, group) && (!it.ready || !it.pw || !it.pw.on || t - it.pw.t0 < 2.5)) return false;
    return true;
  }
  // the group's lit sprites (signs + outlines; the HOTEL's bulbs steady) composed once into one canvas
  function composite(group) {
    const sps = items.filter(it => inGroup(it, group) && it.lit).flatMap(it => it.lit);
    if (!sps.length) return null;
    const x0 = Math.max(0, Math.min(...sps.map(s => s.x))), y0 = Math.min(...sps.map(s => s.y)), x1 = Math.min(W, Math.max(...sps.map(s => s.x + s.w))), y1 = Math.max(...sps.map(s => s.y + s.h));
    return sprite({ x0, y0, x1, y1 }, 0, dpr, x => {
      x.globalCompositeOperation = 'lighter';
      if (group === 'far') for (const gf of glassFaces) ledFacade(x, gf, 0, { motion: false, night: 1, fade: 1 }, 0);   // (the LED facades, still)
      for (const s of sps) x.drawImage(s.c, s.x, s.y, s.w, s.h);
      const D = warmDot();
      for (const it of items) if (inGroup(it, group) && it.kind === 'sign' && it.sg.bulbs) it.sg.bulbs.forEach(([bx, by], i) => { x.globalAlpha = i % 3 === 0 ? 1 : 0.28; const r = i % 3 === 0 ? 2.6 : 1.6; x.drawImage(D, bx - r, by - r, r * 2, r * 2); });
    });
  }
  function dropComp() { for (const g of ['far', 'near']) { free(comp[g]); comp[g] = null; } }
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
  function chasers(c, group, t, k, f) {
    c.save(); c.lineCap = 'round'; c.globalAlpha = 1;
    const sc = SCHEMES.party, roles = ['b0', 'b1', 'h0', 'h1'];
    const bar = f.party && f.party.bar != null ? f.party.bar : Math.floor(t / 2);
    for (const it of items) {
      if (it.kind !== 'outline' || it.o.group !== group || !it.tubes || !it.pw || !it.pw.on) continue;
      if (it.o.strength !== 'hero' && it.o.strength !== 'word' && it.o.strength !== 'pano') continue;
      const col = roleColour(roles[(bar + it.i) % roles.length], sc), w = it.o.st.w * cam.F / 600;
      c.setLineDash([w * 6, w * 10]); c.lineDashOffset = -t * 34;
      if (tier > 1) { c.strokeStyle = rgba(col, 0.55 * k * f.fade); c.lineWidth = w * 3.2;
        c.beginPath(); for (const tb of it.tubes) { c.moveTo(tb.pts[0][0], tb.pts[0][1]); for (let i = 1; i < tb.pts.length; i++) c.lineTo(tb.pts[i][0], tb.pts[i][1]); } c.stroke(); }
      c.strokeStyle = rgba(mix(col, [255, 255, 255], 0.3), 0.95 * k * f.fade); c.lineWidth = w * 1.3;
      c.beginPath(); for (const tb of it.tubes) { c.moveTo(tb.pts[0][0], tb.pts[0][1]); for (let i = 1; i < tb.pts.length; i++) c.lineTo(tb.pts[i][0], tb.pts[i][1]); } c.stroke();
    }
    c.setLineDash([]); c.restore();
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
    /** bumps when a billboard's content changes: the scene re-bakes (the boards are baked with the facades) */
    get rev() { return rev; },
    /** the number of power items (the neon plan's "signs": title.js#neonNow) */
    count: () => items.length || 16,
    get pending() { return queue.length > 0; },
    setTier(t) { tier = t; dropComp(); },
    /** tonight's pick changes only while the neon is dark (never while you watch); key: nightKey(local) */
    night(k) { if (k !== assignKey && !items.some(it => it.pw && it.pw.on)) { assignKey = k; return true; } return false; },
    /** a moment: 'party' (k 0..1: chasers + beat + colour shifts), 'chase' (on/off), 'flash' ({ game } | { cols }: the game's
     *  colours sweep across the skyline), 'scheme' (a name in SCHEMES: the outlines re-lit in it) */
    moment(name, v) {
      if (name === 'party') moment.party = clamp01(+v || 0);
      else if (name === 'chase') moment.chase = !!v;
      else if (name === 'flash') { const g = v && v.game && games.find(x => x.id === v.game); const cols = (v && v.cols) || (g ? markFor(g).tubes.map(t => hexRgb(t.col)).concat([hexRgb(SIGN_ACC[g.id] || '#ffffff')]) : [[255, 46, 151], [46, 230, 255]]); moment.flash = { t0: performance.now(), dur: 1.6, cols }; }
      else if (name === 'scheme' && (SCHEMES[v] || v === 'city') && v !== scheme) { scheme = v; dropComp(); for (const it of items) if (it.kind === 'outline') queue.push(() => { const old = it.lit; buildItem(it); old && old.forEach(free); }); }
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
    debug: () => ({ signs: signs.map(sg => ({ id: sg.id, game: sg.game, kind: sg.kind, type: sg.type, rect: { x: +sg.rect.x.toFixed(1), y: +sg.rect.y.toFixed(1), w: +sg.rect.w.toFixed(1), h: +sg.rect.h.toFixed(1) }, on: !!(items.find(i => i.sg === sg) || {}).pw?.on })), boards: boards.map(b => ({ id: b.id, show: b.content.title })), outlines: outs.map(o2 => ({ id: o2.id, group: o2.group, strength: o2.strength, runs: o2.runs.length, roles: o2.roles })), items: items.length, built, queued: queue.length, mb: +(mbSprites + (comp.far ? comp.far.mb : 0) + (comp.near ? comp.near.mb : 0)).toFixed(2), comp: { far: !!comp.far, near: !!comp.near }, tier, night: assignKey, scheme, led: glassFaces.length, moment: { party: moment.party, chase: moment.chase, flash: !!moment.flash } }),
    destroy() { for (const it of [...items, ...(pending ? pending.items : [])]) freeItem(it); items = []; pending = null; queue = []; dropComp(); free({ c: dot }); },
    _reset() { glassFaces = []; },
  };
}
export { nightKey };
