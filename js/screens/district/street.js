// LIVING CITY — the street and the rails (district/scene.js draws them; the clock and weather come from core/sky.js#look).
//   train(c, s, mid)    after the mid row: an elevated line on its viaduct; every few minutes a train crosses (rush hours more
//                       often, none in the small hours) — lit windows after dark, silver by day, a headlight, a tail light and
//                       now and then a blue spark off the rail. The near towers hide it at the sides, so it's seen in the gaps.
//   steam(c, s, near)   after the near row: steam from rooftop vents when it's cold (live temperature, else the season),
//                       drifting with the real wind, lit by the neon at night
//   traffic(c, s)       on the street at the towers' feet: headlights one way, tail lights the other, their light pooled and
//                       streaked on the wet street; by day small cars catching the light. The flow follows the clock: the
//                       morning and evening rush, a stray cab at 3 am.
// Force in a preview: &force=train,steam,rush (THE STREET: bus,partybus,owl,plow,moto,truck,vintage; docs/title.md).

const TAU = Math.PI * 2;
const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; };
import { busGap, busSlot, busRoute, isOwlHour, carKind, plowDue } from '../../core/street-life.js';

function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

/** PURE: how busy the streets are at a local hour (0..1): the morning and evening rush, a quiet small hours. */
export function trafficAt(hr, dow = 3) {
  const g = (c, w) => Math.exp(-Math.pow((hr - c) / w, 2));
  const weekend = dow === 0 || dow === 6;
  const base = 0.12 + 0.5 * clamp01((hr - 6) / 3) * (1 - clamp01((hr - 23) / 2.5)) + (hr < 3 ? 0.18 * (1 - hr / 3) : 0);
  const rush = weekend ? 0.15 * g(13, 3) + 0.25 * g(21, 2.5) : 0.55 * g(8.2, 1.1) + 0.6 * g(17.6, 1.4);
  return clamp01(base + rush);
}
/** PURE: minutes between trains at a local hour (Infinity in the small hours). */
export function trainGap(hr) {
  if (hr >= 1.5 && hr < 5) return Infinity;
  const rush = (hr >= 7 && hr < 9.5) || (hr >= 16.5 && hr < 19);
  return rush ? 1.6 : hr >= 22 || hr < 1.5 ? 6 : 3.2;
}

export function createStreet() {
  let W = 1, H = 1, HZ = 1, K = 1;
  let cars = [], trains = [], nextTrain = 6 + Math.random() * 20, puffs = [], vents = null, ventKey = '';
  let viaduct = null, viaKey = '', forcedTrain = false;
  const glowC = new Map();
  const glow = (col) => { const k = col.join(','); let g = glowC.get(k); if (!g) { g = mk(64, 64); const x = g.getContext('2d'); const gr = x.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, `rgba(${k},1)`); gr.addColorStop(0.35, `rgba(${k},0.35)`); gr.addColorStop(1, `rgba(${k},0)`); x.fillStyle = gr; x.fillRect(0, 0, 64, 64); glowC.set(k, g); } return g; };
  let puffSpr = null;
  const puff = () => puffSpr || (puffSpr = (() => { const c = mk(64, 64), x = c.getContext('2d'); const R = rng(5); for (let i = 0; i < 9; i++) { const px = 32 + (R() - 0.5) * 22, py = 32 + (R() - 0.5) * 22, r = 10 + R() * 14; const g = x.createRadialGradient(px, py, 0, px, py, r); g.addColorStop(0, 'rgba(255,255,255,0.32)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); } return c; })());

  const hourOf = L => (L.local ? L.local.h + L.local.mi / 60 : 20);
  const cold = L => (L.live ? (L.temp != null ? L.temp < 9 : false) : false) || L.season.winter > 0.45 || (L.season.autumn > 0.6 && L.w.night + L.w.late > 0.5);

  // ---------------------------------------------------------------- the viaduct (baked per size): a deck, a lattice, piers
  function bakeViaduct(y, P) {
    const cv = mk(W * 2, (HZ - y + 4) * 2), x = cv.getContext('2d');
    x.scale(2, 2);
    const ink = 'rgba(6,6,16,0.96)';
    x.fillStyle = ink;
    x.fillRect(0, 0, W, 3.2);                                   // the deck
    x.fillRect(0, 6.5, W, 1.2);                                 // the lower chord
    x.strokeStyle = ink; x.lineWidth = 0.8;
    x.beginPath(); for (let px = 0; px < W; px += 7) { x.moveTo(px, 3); x.lineTo(px + 3.5, 6.8); x.lineTo(px + 7, 3); } x.stroke();   // the lattice
    for (let px = 18; px < W; px += 64) { x.fillRect(px, 7, 3, HZ - y); x.fillRect(px - 2, 7, 7, 1.6); }                              // piers
    // a faint line of light along the rail (the city's glow on wet steel)
    x.fillStyle = 'rgba(180,160,255,0.16)'; x.fillRect(0, -0.6, W, 0.8);
    void P;
    return cv;
  }

  // ---------------------------------------------------------------- THE STREET: vehicles (shape height + light: paint doesn't read at night)
  let busDue = false, spray = [];
  let bus = null, lastBusT = -99, lastSlot = null, lastPlow = null, busN = 0, plowLanes = [], flakes = [];
  const DAYCOL = [[236, 238, 242], [178, 184, 192], [110, 116, 126], [26, 28, 34], [34, 64, 122], [150, 30, 36], [36, 74, 52], [196, 178, 140], [92, 96, 120]];
  // [length, height, roof width, roof height] in K at full size
  const DIM = { sedan: [13, 4.2, 0.56, 0.7], compact: [10.5, 4, 0.6, 0.75], suv: [13.5, 5.6, 0.72, 0.55], van: [14, 7, 0, 0], pickup: [14, 4.4, 0.36, 0.85], truck: [19, 8.6, 0, 0], moto: [6, 3.2, 0, 0], cab: [13, 4.2, 0.56, 0.7], vintage: [13, 4.6, 0.5, 0.8], plow: [17, 8, 0, 0] };
  function spawnCar(hr, party, peak, force, kindIn) {
    let kind = kindIn || carKind(Math.random(), hr, { party: !!party });
    if (!kindIn) for (const f of ['moto', 'truck', 'vintage']) if (force.has(f) && Math.random() < 0.5) kind = f;
    const lane = kind === 'plow' ? 1 : Math.random() < 0.5 ? 0 : 1;   // 0: the far lane (going right), 1: the near lane (going left)
    const dir = lane === 0 ? 1 : -1, sc = lane === 0 ? 0.85 : 1;
    const d = DIM[kind];
    const pal = party && party.palette ? party.palette : null;
    const under = kind !== 'plow' && kind !== 'truck' && pal && Math.random() < (0.35 + 0.15 * peak) * party.ramp ? pal[Math.floor(Math.random() * pal.length)] : null;
    const cruise = (kind === 'plow' ? 24 : kind === 'moto' ? 70 + Math.random() * 25 : kind === 'truck' ? 38 + Math.random() * 12 : 40 + Math.random() * 30) * K * sc;
    cars.push({ kind, lane, dir, sc, x: dir > 0 ? -40 * K : W + 40 * K, sp: cruise, cruise, len: d[0] * K * sc, h: d[1] * K * sc, cab: kind === 'cab', under, led: Math.random() < 0.4, col: kind === 'vintage' ? (Math.random() < 0.5 ? [92, 22, 30] : [24, 62, 44]) : DAYCOL[Math.floor(Math.random() * DAYCOL.length)], ph: Math.random() * TAU, beacon: Math.random() * TAU });
  }
  function spawnBus(hr, party, force) {
    busN++; lastBusT = performance.now() / 1000;
    const owl = force.has('owl') || isOwlHour(hr);
    const isParty = force.has('partybus') || (!!party && party.ramp > 0.3 && Math.random() < 0.8);
    const sc = 0.92, len = 36 * K * sc, h = 13.5 * K * sc;
    const nWin = 7;
    bus = { kind: 'bus', lane: 0, dir: 1, sc, x: -len, sp: 36 * K, cruise: 36 * K, len, h, state: 'drive', dwell: 0, owl, party: isParty,
      route: busRoute(busN, { party: isParty, owl }), riders: Array.from({ length: nWin }, () => Math.random() < (owl ? 0.15 : isParty ? 0.85 : 0.55)), nWin, scroll: 0 };
  }
  // the amber LED destination sign: its text baked once per route, scrolled softly in the sign's window
  const signCache = new Map();
  function destSign(text) {
    let s = signCache.get(text);
    if (!s) { s = mk(text.length * 7 + 40, 12); const x = s.getContext('2d'); x.font = 'bold 9px "JetBrains Mono", monospace'; x.fillStyle = '#ffb02e'; x.textBaseline = 'middle'; x.fillText(text, 20, 6.5); signCache.set(text, s); }
    return s;
  }
  function lights(c, x, y, col, a, r) { c.globalAlpha = a; c.drawImage(glow(col), x - r, y - r, r * 2, r * 2); }
  function drawCar(c, v, s, dark, wet, party, streak) {
    const { t } = s;
    const y = HZ + (v.lane === 0 ? 3.2 : 7.6) * K, sc = v.sc, bw = v.len, bh = v.h, x = v.x;
    const night = dark > 0.5, body = v.cab ? (night ? 'rgba(60,46,10,0.92)' : 'rgba(214,170,40,0.96)') : night ? 'rgba(10,10,20,0.93)' : `rgba(${v.col.join(',')},0.96)`;
    const d = DIM[v.kind];
    c.fillStyle = body;
    if (v.kind === 'moto') {
      c.fillRect(x - bw / 2, y - bh * 0.55, bw, bh * 0.4);                                          // the bike
      c.fillStyle = night ? 'rgba(14,14,24,0.95)' : 'rgba(40,40,52,0.95)'; c.fillRect(x - bw * 0.12, y - bh * 1.5, bw * 0.24, bh);   // the rider
    } else if (v.kind === 'van' || v.kind === 'truck' || v.kind === 'plow') {
      const cabW = v.kind === 'van' ? bw : bw * 0.3, boxH = v.kind === 'van' ? bh : bh;
      if (v.kind !== 'van') { c.fillStyle = v.kind === 'plow' && !night ? 'rgba(232,124,26,0.97)' : night ? 'rgba(12,12,22,0.94)' : 'rgba(226,228,232,0.97)'; c.fillRect(x - bw / 2 + (v.dir > 0 ? 0 : cabW), y - boxH, bw - cabW, boxH); c.fillStyle = v.kind === 'plow' && !night ? 'rgba(232,124,26,0.97)' : body; }
      c.fillRect(v.dir > 0 ? x + bw / 2 - cabW : x - bw / 2, y - (v.kind === 'van' ? bh : bh * 0.78), cabW, v.kind === 'van' ? bh : bh * 0.78);
      if (v.kind === 'plow') { c.fillStyle = night ? 'rgba(40,36,20,0.95)' : 'rgba(250,200,40,0.97)'; c.beginPath(); const fx = x + v.dir * bw / 2; c.moveTo(fx, y); c.lineTo(fx + v.dir * 3.4 * K, y); c.lineTo(fx + v.dir * 1.6 * K, y - bh * 0.55); c.lineTo(fx, y - bh * 0.5); c.fill(); }
    } else {
      c.fillRect(x - bw / 2, y - bh, bw, bh);
      if (d[2]) { const rx = v.kind === 'pickup' ? (v.dir > 0 ? x + bw * 0.08 : x - bw * 0.44) : x - bw * d[2] / 2; c.fillRect(rx, y - bh * (1 + d[3]), bw * d[2], bh * d[3] + 0.5); }
    }
    if (!night && v.kind !== 'moto') {
      c.fillStyle = 'rgba(214,226,244,0.62)';
      if (v.kind === 'van') c.fillRect(x - bw * 0.42, y - bh * 0.92, bw * 0.84, bh * 0.28);
      else if (d[2]) c.fillRect(x - bw * d[2] * 0.42 + (v.kind === 'pickup' ? (v.dir > 0 ? bw * 0.26 : -bw * 0.26) : 0), y - bh * (1 + d[3] * 0.85), bw * d[2] * 0.84, bh * d[3] * 0.4);
      c.fillStyle = 'rgba(12,12,18,0.9)'; c.fillRect(x - bw * 0.36, y - 0.9 * K, 2.2 * K * sc, 1.2 * K); c.fillRect(x + bw * 0.36 - 2.2 * K * sc, y - 0.9 * K, 2.2 * K * sc, 1.2 * K);   // the wheels
    }
    if (dark > 0.2) {
      c.save(); c.globalCompositeOperation = 'lighter';
      const front = x + v.dir * bw * 0.5, back = x - v.dir * bw * 0.5, ly = y - bh * 0.55;
      const head = v.kind === 'vintage' ? [255, 214, 150] : v.led ? [226, 238, 255] : [255, 232, 194];
      // headlights face the way it goes: we see the near lane's fronts and the far lane's backs (+ brake lights when stopping)
      if (v.lane === 1) {
        const r = (v.kind === 'vintage' ? 6.2 : 5) * sc;
        lights(c, front, ly, head, dark * 0.95, r);
        if (v.kind !== 'moto') lights(c, front - v.dir * 3 * K * sc, ly, head, dark * 0.95, r);
        c.globalAlpha = 0.25 * dark; c.drawImage(glow(head), front + (v.dir > 0 ? 0 : -46 * K), y - 6, 46 * K, 9);
        lights(c, back, ly, [255, 40, 60], dark * (v.brake ? 0.85 : 0.25), (v.brake ? 4.6 : 3) * sc);
        if (streak) streak(front, 7 * sc, (H - HZ) * 0.35 * wet, v.led ? '#e2eeff' : '#fff1d6', 0.16 * dark * wet, t, v.ph);
      } else {
        const r = 5 * sc * (v.brake ? 1.2 : 1);
        lights(c, back, ly, [255, 40, 60], dark * (v.brake ? 1 : 0.8), r);
        if (v.kind !== 'moto') lights(c, back + v.dir * 3.2 * K * sc, ly, [255, 40, 60], dark * (v.brake ? 1 : 0.8), r);
        if (streak) streak(back, 7 * sc, (H - HZ) * 0.35 * wet, '#ff3046', (v.brake ? 0.18 : 0.12) * dark * wet, t, v.ph);
      }
      if (v.kind === 'truck') for (let k = 0; k < 5; k++) lights(c, x - bw * 0.4 + k * bw * 0.2, y - bh - 0.4 * K, [255, 170, 40], dark * 0.85, 2.2 * K * sc);   // the amber marker row
      if (v.cab) lights(c, x, y - bh * 1.9, [255, 214, 90], dark * (party ? 1 : 0.8), (party ? 4.2 : 3) * sc);
      if (v.hail && (v.hstate === 'pickup' || (v.hstate === 'coming' && Math.abs(v.target - x) < 60 * K))) {
        if ((s.t * 2.4) % 1 < 0.5) { lights(c, x - bw * 0.48, ly, [255, 166, 30], Math.max(0.5, dark), 4 * sc); lights(c, x + bw * 0.48, ly, [255, 166, 30], Math.max(0.5, dark), 4 * sc); }
        if (v.hstate === 'pickup' && v.doorT < 1.4) lights(c, x, y - bh * 1.1, [255, 222, 160], Math.max(0.6, dark) * (1 - v.doorT / 1.4), 9 * K * sc);
      }
      if (v.under && party) { const ug = 0.36 * dark * party.ramp * (0.7 + 0.3 * party.breath); c.globalAlpha = ug; c.drawImage(glow(v.under), x - bw * 0.9, y - bh * 0.9, bw * 1.8, bh * 1.8); if (streak) streak(x, bw * 0.9, (H - HZ) * 0.22 * wet, `rgb(${v.under.join(',')})`, ug * 0.5, t, v.ph + 1); }
      c.restore();
    }
    // the plow: a slow amber beacon (the part that reads), a curl of snow off the blade, salt sparkling behind, a darker wet lane
    if (v.kind === 'plow') {
      v.beacon += s.dt / 1000 * 4.2;
      const k = Math.pow(Math.max(0, Math.sin(v.beacon)), 3);
      c.save(); c.globalCompositeOperation = 'lighter';
      lights(c, x + v.dir * bw * 0.38, y - bh * 0.78 - 1.2 * K, [255, 168, 30], 0.35 + 0.65 * k, (3 + 7 * k) * K);
      if (streak) streak(x + v.dir * bw * 0.38, 5 * K, (H - HZ) * 0.3 * wet, '#ffa81e', 0.12 * k, s.t, v.ph);
      c.restore();
      if (s.motion && Math.random() < 0.7) flakes.push({ x: x + v.dir * (bw / 2 + 2.5 * K), y: y - 1.5 * K, vx: v.dir * (8 + Math.random() * 14) * K, vy: -(10 + Math.random() * 10) * K, life: 0, max: 0.6 + Math.random() * 0.4, salt: false });
      if (s.motion && Math.random() < 0.5) flakes.push({ x: x - v.dir * bw / 2, y: y - 0.6 * K, vx: -v.dir * (2 + Math.random() * 6) * K, vy: (Math.random() - 0.5) * 3 * K, life: 0, max: 0.5 + Math.random() * 0.5, salt: true });
      let pl = plowLanes.find(p => p.v === v); if (!pl) { pl = { v, x0: x, x1: x, age: 0 }; plowLanes.push(pl); }
      pl.x0 = Math.min(pl.x0, x); pl.x1 = Math.max(pl.x1, x); pl.age = 0;
    }
  }
  function drawPlowLane(c, s, sec) {
    // the wet lane it leaves behind, fading as the snow falls again; the snow curl and the salt
    for (const p of plowLanes) { p.age += sec; c.fillStyle = `rgba(4,6,14,${0.28 * Math.max(0, 1 - p.age / 90)})`; c.fillRect(Math.max(0, p.x0), HZ + 5.4 * K, Math.min(W, p.x1) - Math.max(0, p.x0), 4.6 * K); }
    plowLanes = plowLanes.filter(p => p.age < 90);
    flakes = flakes.filter(f => { f.life += sec; if (f.life > f.max) return false; f.vy += 40 * K * sec; f.x += f.vx * sec; f.y += f.vy * sec; const a = 1 - f.life / f.max; c.fillStyle = f.salt ? `rgba(255,255,255,${0.7 * a * (Math.random() < 0.5 ? 1 : 0.3)})` : `rgba(236,242,255,${0.85 * a})`; c.fillRect(f.x, f.y, f.salt ? 0.6 : 1.2 * K, f.salt ? 0.6 : 1.2 * K); return true; });
    if (flakes.length > 80) flakes.splice(0, flakes.length - 80);
  }
  function drawBus(c, b, s, dark, wet, party, info, streak) {
    const { t } = s;
    const y = HZ + 3.2 * K, x = b.x, L2 = b.len, h = b.h, x0 = x - L2 / 2, top = y - h;
    const night = dark > 0.5;
    // the body: a clean two-tone transit livery by day, a dark shape between its lights at night
    c.fillStyle = night ? 'rgba(12,14,26,0.96)' : 'rgba(232,238,245,0.98)'; c.fillRect(x0, top, L2, h);
    if (!night) { c.fillStyle = 'rgba(30,78,140,0.98)'; c.fillRect(x0, top + h * 0.6, L2, h * 0.4); c.fillStyle = 'rgba(236,180,40,0.95)'; c.fillRect(x0, top + h * 0.56, L2, h * 0.05); }
    c.fillStyle = night ? 'rgba(6,6,12,1)' : 'rgba(14,14,20,0.95)'; c.fillRect(x0 + L2 * 0.16, y - 1.2 * K, 3 * K, 1.6 * K); c.fillRect(x0 + L2 * 0.78, y - 1.2 * K, 3 * K, 1.6 * K);   // the wheels
    // the row of windows: warm and lit after dark (a few riders), glass by day; the party bus pulses in the party's colours
    const wy = top + h * 0.16, wh = h * 0.34, ww = (L2 * 0.78) / b.nWin, wx0 = x0 + L2 * 0.06;
    const pal = b.party && party && party.palette ? party.palette : null;
    const beat = pal ? 0.6 + 0.5 * party.breath : 1;
    c.save();
    for (let i = 0; i < b.nWin; i++) {
      const wx = wx0 + i * ww;
      if (night || dark > 0.25) {
        const col = pal ? pal[(i + (party.bar || 0)) % pal.length] : [255, 222, 166];
        c.fillStyle = `rgba(${col.map(v => Math.round(v * (pal ? 0.9 : 1))).join(',')},${Math.min(1, (b.owl ? 0.7 : 0.9) * beat * Math.max(dark, 0.4))})`;
      } else c.fillStyle = 'rgba(70,96,128,0.92)';
      c.fillRect(wx + 0.4 * K, wy, ww - 0.8 * K, wh);
      if (b.riders[i]) { c.fillStyle = night ? 'rgba(20,14,22,0.85)' : 'rgba(30,36,48,0.7)'; c.beginPath(); c.arc(wx + ww * 0.5, wy + wh * 0.42, 0.9 * K, 0, TAU); c.fill(); c.fillRect(wx + ww * 0.5 - 1.3 * K, wy + wh * 0.62, 2.6 * K, wh * 0.38); }
    }
    // the amber LED destination sign up front, scrolling softly
    const sx = x + L2 / 2 - 9 * K, sy = top + 0.8 * K, sw = 8 * K, sh = 2.2 * K;
    c.fillStyle = 'rgba(10,8,6,0.95)'; c.fillRect(sx, sy, sw, sh);
    b.scroll += s.dt / 1000 * 9;
    const sp = destSign(b.route), win = sw / sh * 12, off = (b.scroll % (sp.width + 0)) ;
    c.save(); c.beginPath(); c.rect(sx, sy, sw, sh); c.clip();
    c.globalAlpha = 0.95; c.drawImage(sp, off, 0, win, 12, sx, sy, sw, sh);
    if (off + win > sp.width) c.drawImage(sp, 0, 0, off + win - sp.width, 12, sx + sw * (sp.width - off) / win, sy, sw * (off + win - sp.width) / win, sh);
    c.restore();
    // the party bus: neon trim along its body in the party's colours
    if (pal) {
      c.globalCompositeOperation = 'lighter';
      const g = c.createLinearGradient(x0, 0, x0 + L2, 0); pal.forEach((col, i) => g.addColorStop(i / Math.max(1, pal.length - 1), `rgba(${col.join(',')},1)`));
      c.globalAlpha = 0.9 * Math.max(0.5, dark) * beat; c.fillStyle = g; c.fillRect(x0, top + h * 0.56, L2, 0.9 * K); c.fillRect(x0, top - 0.2 * K, L2, 0.7 * K);
      c.globalAlpha = 0.35 * dark * beat; c.drawImage(glow(pal[0]), x0, top - 3 * K, L2, h * 0.5);
      c.globalCompositeOperation = 'source-over';
    }
    // snow on its roof
    if (info.snowCover > 0.05) { c.globalAlpha = info.snowCover; c.fillStyle = 'rgba(238,244,255,0.95)'; c.fillRect(x0 + 1 * K, top - 1 * K, L2 - 2 * K, 1.2 * K); }
    c.globalAlpha = 1;
    // its lights: the headlight, the tail + brake lights, its window band in the wet street
    if (dark > 0.2) {
      c.globalCompositeOperation = 'lighter';
      lights(c, x + L2 / 2 - 0.6 * K, y - 2.2 * K, [255, 236, 200], dark, 5.4);
      c.globalAlpha = 0.22 * dark; c.drawImage(glow([255, 240, 210]), x + L2 / 2, y - 6, 50 * K, 9);
      lights(c, x0 + 0.6 * K, y - 2.4 * K, [255, 40, 60], dark * (b.brake ? 1 : 0.7), b.brake ? 6 : 4.4);
      if (streak) {
        const col = pal ? pal[0] : [255, 214, 150];
        for (let k = 0; k < 3; k++) streak(x0 + L2 * (0.22 + k * 0.28), L2 * 0.22, (H - HZ) * 0.3 * wet, `rgb(${col.join(',')})`, 0.1 * dark * wet * beat, t, k + b.route.length);
        streak(x0 + 0.6 * K, 6, (H - HZ) * 0.3 * wet, '#ff3046', (b.brake ? 0.2 : 0.1) * dark * wet, t, 9);
      }
      c.globalCompositeOperation = 'source-over';
    }
    c.restore();
    c.globalAlpha = 1;
  }

  return {
    k: () => K,
    resize(w, h, hz) { if (w === W && h === H && hz === HZ) return; W = w; H = h; HZ = hz; K = Math.max(0.9, Math.min(1.4, w / 390)); cars = []; trains = []; puffs = []; bus = null; plowLanes = []; flakes = []; viaKey = ''; ventKey = ''; },   // same size: keep the traffic
    /** the elevated line (after the mid row of towers) */
    train(c, s, railY) {
      const { L, P, dt, t, motion, force } = s;
      const y = Math.round(railY);
      const key = `${W}|${HZ}|${y}`;
      if (key !== viaKey) { viaduct = bakeViaduct(y, P); viaKey = key; }
      c.drawImage(viaduct, 0, y, W, HZ - y + 4);
      if (!motion) return;
      const sec = dt / 1000, hr = hourOf(L);
      const gap = trainGap(hr);
      const forced = force.has('train');
      if (forced || gap !== Infinity) nextTrain -= sec;
      if ((forced && !forcedTrain) || ((forced || gap !== Infinity) && nextTrain <= 0)) {
        forcedTrain = true;
        nextTrain = forced ? 8 : gap * 60 * (0.7 + Math.random() * 0.6);   // a preview: one every few seconds
        const dir = Math.random() < 0.5 ? 1 : -1, n = 5 + Math.floor(Math.random() * 3);
        trains.push({ dir, n, x: dir > 0 ? -n * 34 * K - 20 : W + 20, v: (95 + Math.random() * 25) * K * dir, wins: Array.from({ length: n * 6 }, () => Math.random() < 0.82), spark: 0 });
      }
      if (!trains.length) return;
      const dark = L.w.night + L.w.late + L.w.golden * 0.5;
      const carW = 32 * K, carH = 7.2 * K, gapC = 2 * K, top = y - carH - 0.6;
      trains = trains.filter(tr => {
        tr.x += tr.v * sec;
        for (let i = 0; i < tr.n; i++) {
          const cx = tr.dir > 0 ? tr.x + i * (carW + gapC) : tr.x + i * (carW + gapC);
          if (cx > W + 40 || cx + carW < -40) continue;
          // the car: dark body by night, silver by day, a roof line
          c.fillStyle = dark > 0.5 ? 'rgba(14,14,26,0.98)' : 'rgba(120,128,148,0.98)';
          c.beginPath(); c.roundRect ? c.roundRect(cx, top, carW, carH, 1.6 * K) : c.rect(cx, top, carW, carH); c.fill();
          c.fillStyle = dark > 0.5 ? 'rgba(90,90,130,0.5)' : 'rgba(230,236,246,0.7)'; c.fillRect(cx + 1, top + 0.4, carW - 2, 0.7);
          // the windows: a warm row, a few dark
          for (let w = 0; w < 6; w++) {
            const on = tr.wins[i * 6 + w];
            const wx = cx + 2.4 * K + w * (carW - 4.8 * K) / 6, ww = (carW - 4.8 * K) / 6 - 1.2 * K;
            c.fillStyle = dark > 0.4 ? (on ? 'rgba(255,224,170,0.95)' : 'rgba(40,40,64,0.9)') : 'rgba(40,52,74,0.85)';
            c.fillRect(wx, top + carH * 0.3, ww, carH * 0.36);
          }
        }
        // its light: the windows' glow, a headlight beam ahead, a red tail light
        const head = tr.dir > 0 ? tr.x + tr.n * (carW + gapC) - gapC : tr.x;
        const tail = tr.dir > 0 ? tr.x : tr.x + tr.n * (carW + gapC) - gapC;
        if (dark > 0.3) {
          c.globalCompositeOperation = 'lighter';
          c.globalAlpha = 0.28 * dark; c.drawImage(glow([255, 214, 160]), Math.min(head, tail) - 10, top - 10, Math.abs(head - tail) + 20, carH + 20);
          c.globalAlpha = 0.9 * dark; c.drawImage(glow([255, 246, 220]), head - 6 + tr.dir * 2, top + carH * 0.5 - 6, 12, 12);
          c.globalAlpha = 0.35 * dark; c.drawImage(glow([255, 240, 210]), head + (tr.dir > 0 ? 0 : -70 * K), top - 4, 70 * K, carH + 8);
          c.globalAlpha = 0.85 * dark; c.drawImage(glow([255, 50, 70]), tail - 4, top + carH * 0.5 - 4, 8, 8);
          // a spark off the rail, now and then
          if (Math.random() < sec * 0.9) tr.spark = 1;
          if (tr.spark > 0) { const sx = tail + (head - tail) * (0.3 + 0.4 * Math.random()); c.globalAlpha = tr.spark; c.drawImage(glow([150, 200, 255]), sx - 9, y - 9, 18, 18); tr.spark = Math.max(0, tr.spark - sec * 7); }
          c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
        }
        return tr.dir > 0 ? tr.x < W + 60 : tr.x + tr.n * (carW + gapC) > -60;
      });
    },
    /** steam from rooftop vents (after the near row): when it's cold */
    steam(c, s, near) {
      const { L, P, dt, motion, force } = s;
      const on = force.has('steam') || cold(L);
      if (!on && !puffs.length) return;
      const sec = dt / 1000;
      const key = `${W}|${HZ}|${near.rects.length}`;
      if (key !== ventKey) {
        ventKey = key;
        const R = rng(31);
        // two or three vents on near roofs at the sides (clear of the sign above), one manhole on the street
        const roofs = near.rects.filter(r => r.w > 24 && near.top + r.y > HZ * 0.45 && near.top + r.y < HZ - 20 && Math.abs(r.x - near.margin + r.w / 2 - W / 2) > W * 0.18);
        vents = roofs.sort(() => R() - 0.5).slice(0, 3).map(r => ({ rx: r.x + r.w * (0.2 + R() * 0.6), ry: r.y, at: 0, rate: 0.9 + R() * 0.8 }));
        vents.push({ street: true, x: W * (0.3 + R() * 0.4), at: 0, rate: 1.6 });
      }
      const wind = Math.sin((L.windDir || 250) * Math.PI / 180) * Math.min(12, L.wind || 2);
      if (on && motion) for (const v of vents) {
        v.at -= sec;
        if (v.at <= 0) {
          v.at = 1 / v.rate * (0.6 + Math.random() * 0.8);
          const x = v.street ? v.x : near.ox + v.rx, y = v.street ? HZ + 10 : near.oy + v.ry;
          puffs.push({ x, y, vx: wind * 2.2 + (Math.random() - 0.5) * 4, vy: -(10 + Math.random() * 8) * (v.street ? 0.8 : 1), r: (v.street ? 5 : 4) * K, life: 0, max: 4 + Math.random() * 2.5 });
        }
      }
      const night = L.w.night + L.w.late;
      const tint = night > 0.4 ? [255, 220, 245] : [255, 255, 255];
      c.globalCompositeOperation = night > 0.4 ? 'lighter' : 'source-over';
      puffs = puffs.filter(p => {
        p.life += sec; if (p.life > p.max) return false;
        if (motion) { p.x += p.vx * sec; p.y += p.vy * sec; p.vy *= 0.995; p.vx += wind * 0.4 * sec; }
        const u = p.life / p.max, r = p.r * (1 + u * 4.5);
        c.globalAlpha = Math.sin(Math.PI * Math.min(1, u * 1.3)) * (night > 0.4 ? 0.22 : 0.4) * (1 - u * 0.5);
        c.drawImage(puff(), p.x - r, p.y - r, r * 2, r * 2);
        return true;
      });
      void tint; void P;
      c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
    },
    /** the street's traffic at the towers' feet: the car mix, queues at the stop light, the bus (+ the PARTY BUS, the night
     *  owl), the snowplows — their light pooled and streaked on the wet street (THE STREET, docs/title.md) */
    traffic(c, s, streak) {
      const { L, dt, t, motion, force, tier } = s;
      const sec = Math.min(0.1, dt / 1000), hr = hourOf(L), now = s.now || Date.now();
      const mot = Math.min(3, s.speed || 1);   // (&speed= previews: the traffic moves up to 3× faster too)
      const info = s.street || { signals: [], shelter: null, snowCover: 0 };
      const party = s.party && s.party.on > 0 ? s.party : null;
      const peak = party ? (party.energy > 0.85 ? (party.energy - 0.85) / 0.15 : 0) * party.ramp : 0;
      const dark = clamp01(L.w.night + L.w.late + L.w.golden * 0.7 + L.w.dawn * 0.5 + (L.rain ? 0.3 : 0));
      const wet = L.rain ? 1 : 0.55;
      if (motion) {
        // new cars: the flow follows the clock (and the party); the kind follows the hour
        const flow = Math.min(1, (force.has('rush') ? 1 : trafficAt(hr, L.local ? L.local.dow : 3)) * (party ? 1 + 0.7 * party.ramp * (0.6 + 0.4 * party.energy) : 1));
        const want = Math.round(flow * (tier === 0 ? 6 : 12) * K);
        if (cars.length < want && Math.random() < sec * (0.6 + flow * 2.5)) spawnCar(hr, party, peak, force);
        // the bus: tied to the clock like the trains (or forced in a preview); at most one on screen
        const gap = busGap(hr), slot = busSlot(now, gap);
        const forcedBus = force.has('bus') || force.has('partybus') || force.has('owl');
        // (a bus that comes due while another is still on screen waits its turn — fast-forward previews keep their buses)
        if (slot != null && slot !== lastSlot && lastSlot != null) busDue = true;
        if (slot !== lastSlot) lastSlot = slot;
        if (!bus && ((forcedBus && t - lastBusT > 8) || busDue)) { busDue = false; spawnBus(hr, party, force); }
        // the snowplows: real snow only
        const pg = force.has('plow') ? 0.35 : plowDue(L);
        const ps = Number.isFinite(pg) ? Math.floor(now / 60000 / pg) : null;
        if (ps != null && ps !== lastPlow && !cars.some(v => v.kind === 'plow')) { if (lastPlow != null || force.has('plow')) spawnCar(hr, party, peak, force, 'plow'); }
        lastPlow = ps;
        // THE CAB HAIL (Part 2): someone at the curb has stepped forward — a cab comes in the curb lane and pulls over for them
        const hail = s.hail;
        if (hail && hail.state === 'waiting' && !hail.cab) {
          const d = DIM.cab, sc = 0.85;
          cars.push({ kind: 'cab', lane: 0, dir: 1, sc, x: -40 * K, sp: 46 * K, cruise: 46 * K, len: d[0] * K * sc, h: d[1] * K * sc, cab: true, under: null, led: false, col: [214, 170, 40], ph: Math.random() * TAU, beacon: 0, hail: true, hstate: 'coming', target: hail.x });
          hail.cab = 'coming';
        }
        // move: car following, the near lane stopping at red, the bus at red and at its stop
        const all = bus ? [...cars, bus] : cars;
        for (const v of all) {
          let want2 = v.cruise;
          // the vehicle ahead in this lane
          let gapAhead = Infinity;
          for (const o of all) { if (o === v || o.lane !== v.lane) continue; const d = v.dir > 0 ? (o.x - o.len / 2) - (v.x + v.len / 2) : (v.x - v.len / 2) - (o.x + o.len / 2); if (d > -v.len * 0.3 && d < gapAhead) gapAhead = d; }
          if (gapAhead < Infinity) want2 = Math.min(want2, Math.max(0, (gapAhead - 3.5 * K) * 2.4));
          // the stop light: the near lane queues on red (and yellow, if it can stop); the bus and a hailed cab obey it in theirs too
          if (v.lane === 1 || v === bus || v.hail) for (const g of info.signals) {
            const stopAt = v.dir < 0 ? g.headX + 7 * K : g.headX - 7 * K;
            const front = v.x + v.dir * v.len / 2;
            const ahead = v.dir < 0 ? front - stopAt : stopAt - front;
            if (ahead < -1 || ahead > 95 * K) continue;
            if (g.state === 'red' || (g.state === 'yellow' && ahead > 12 * K)) want2 = Math.min(want2, Math.max(0, (ahead - 0.5 * K) * 2.2));
            else if (g.state === 'flash' || g.state === 'dark') want2 = Math.min(want2, v.cruise * 0.7);
          }
          // the bus pulls over at the shelter, waits, pulls away
          if (v === bus && info.shelter) {
            const d = info.shelter.x - v.x;
            if (v.state === 'drive' && d > -2 * K && d < 130 * K) { want2 = Math.min(want2, Math.max(0, d * 1.5)); if (d < 1.6 * K && v.sp < 2 * K) { v.state = 'dwell'; v.dwell = 5; } }
            if (v.state === 'dwell') { want2 = 0; v.dwell -= sec * mot; if (v.dwell <= 0) v.state = 'leave'; }
          }
          // the hailed cab pulls over at its passenger, hazards flashing; the door opens (its light flicks on), it pulls away
          if (v.hail && s.hail) {
            const d = v.target - v.x;
            if (v.hstate === 'coming' && d > -2 * K && d < 140 * K) { want2 = Math.min(want2, Math.max(0, d * 1.5)); if (d < 1.6 * K && v.sp < 2 * K) { v.hstate = 'pickup'; v.dwell = 3; v.doorT = 0; s.hail.cab = 'stopped'; } }
            if (v.hstate === 'pickup') { want2 = 0; v.dwell -= sec * mot; v.doorT += sec; if (v.dwell <= 0) { v.hstate = 'leave'; s.hail.cab = 'gone'; } }
          }
          const acc = want2 > v.sp ? 20 * K : 60 * K;
          v.brake = want2 < v.sp - 1.5 * K || v.sp < 1.5 * K;
          v.sp += Math.max(-acc * sec, Math.min(acc * sec, want2 - v.sp));
          v.x += v.dir * v.sp * sec * mot;
        }
        cars = cars.filter(v => { const keep = v.x > -60 * K && v.x < W + 60 * K; if (!keep && v.hail && s.hail && s.hail.cab !== 'gone') s.hail.cab = 'gone'; return keep; });
        if (bus && (bus.x > W + 60 * K)) bus = null;
        if (s.stop) s.stop.dwell = !!(bus && bus.state === 'dwell');
        // SPRAY (Part 2): when it really rains, the wheels throw a soft fan through the wet street (capped per tier; none in Reduced)
        const rainK = force.has('spray') ? 0.8 : (L.live || L.rain) ? (L.rain || 0) : 0;
        if (rainK > 0.12 && tier > 0) {
          const capS = tier === 2 ? 140 : 70;
          for (const v of all) {
            if (v.sp < 8 * K || spray.length >= capS) continue;
            const y = HZ + (v.lane === 0 ? 3.2 : 7.6) * K;
            for (const wx of [v.x - v.dir * v.len * 0.34, v.x + v.dir * v.len * 0.3]) if (Math.random() < sec * 26 * rainK * (tier === 2 ? 1 : 0.5) * (v.sp / (50 * K))) spray.push({ x: wx, y: y - 0.4 * K, vx: -v.dir * v.sp * (0.18 + Math.random() * 0.2) + (Math.random() - 0.5) * 8 * K, vy: -(5 + Math.random() * 9) * K * (0.6 + rainK * 0.6), life: 0, max: 0.35 + Math.random() * 0.35, lane: v.lane });
          }
        }
      } else { cars = []; bus = null; }
      if (!motion) spray = [];
      // draw: the far lane, the bus (also in the far lane), then the near lane in front
      for (const v of cars) if (v.lane === 0) drawCar(c, v, s, dark, wet, party, streak);
      if (bus) drawBus(c, bus, s, dark, wet, party, info, streak);
      for (const v of cars) if (v.lane === 1) drawCar(c, v, s, dark, wet, party, streak);
      drawPlowLane(c, s, sec);
      // the spray, lit by the street (brighter after dark, against the lights)
      if (spray.length) {
        c.save(); c.globalCompositeOperation = dark > 0.4 ? 'lighter' : 'source-over';
        c.fillStyle = dark > 0.4 ? 'rgba(220,226,255,1)' : 'rgba(200,210,226,1)';
        spray = spray.filter(p => { p.life += sec; if (p.life > p.max) return false; p.vy += 34 * K * sec; p.x += p.vx * sec; p.y += p.vy * sec; const u = p.life / p.max; c.globalAlpha = (dark > 0.4 ? 0.3 : 0.35) * (1 - u); const r = (0.6 + u * 1.4) * K; c.fillRect(p.x - r / 2, p.y - r / 2, r, r); return true; });
        c.restore();
      }
    },
    /** the bus on screen (its golden-hour shadow, the tests): { x, w, h, state, route, party, owl } or null */
    busInfo: () => (bus ? { x: bus.x, w: bus.len, h: bus.h, state: bus.state, route: bus.route, party: bus.party, owl: bus.owl } : null),
    debug: () => ({ spray: spray.length, hailCab: (cars.find(v => v.hail) || {}).hstate || null, cars: cars.length, kinds: cars.reduce((m, v) => { m[v.kind] = (m[v.kind] || 0) + 1; return m; }, {}), queued: cars.filter(v => v.lane === 1 && v.sp < 2 * K).length, braking: cars.filter(v => v.brake).length, bus: bus ? { x: Math.round(bus.x), state: bus.state, route: bus.route, party: bus.party, owl: bus.owl, sp: Math.round(bus.sp) } : null, buses: busN, plowLanes: plowLanes.length, trains: trains.length, puffs: puffs.length }),
  };
}
