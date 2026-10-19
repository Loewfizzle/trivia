// LIVING CITY — the birds (district/scene.js draws them; the season, hour and weather come from core/sky.js#look).
//   sky(c, s)      high over the city, in front of the clouds and behind the skyline:
//                    GEESE — V formations in the migrations (Mar–Apr heading north: they come toward us and grow; Sep–Nov
//                    heading south: they fly away into the haze and shrink), wingbeats rippling down each arm, now and then a
//                    straggler catching up; dark against a day sky, their bellies lit by the city at night
//                    THE HERON — a rare, slow crossing near the moon on spring-to-autumn nights
//   low(c, s)      over the far rows: SWIFTS — a screaming party darting round the rooftops on summer evenings
//   mid(c, s, g)   on the near roofs: PIGEONS — a little flock by day, bobbing and pecking; tap them (or wait) and they burst
//                  up, wheel round the block and land again
// Everything is drawn as small silhouettes in the scene's light (no sprites to tint): a goose is ~10 px, a pigeon ~6 px.
// Force them in a preview: &force=geese,swifts,pigeons,heron. Reduced effects: no birds in the sky; pigeons sit still.

const TAU = Math.PI * 2;
const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const ease = t => t * t * (3 - 2 * t);
function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

export function createWildlife() {
  let W = 1, H = 1, HZ = 1, K = 1;
  let geese = null, nextGeese = 40 + Math.random() * 120;
  let heron = null, nextHeron = 300 + Math.random() * 600;
  let swifts = null, nextSwifts = 20 + Math.random() * 60;
  let flock = null, flockKey = '', nextLoop = 90 + Math.random() * 120;

  // ---------------------------------------------------------------- colours in the hour's light
  function inks(L, P) {
    const dark = L.w.night + L.w.late, day = clamp01(L.w.day + L.w.dawn * 0.7 + L.w.golden * 0.7);
    const body = day > 0.5 ? (L.w.golden > 0.4 ? 'rgba(28,18,30,0.92)' : 'rgba(34,38,52,0.88)') : 'rgba(8,7,16,0.95)';
    const g = P.glow;
    const belly = dark > 0.4 ? `rgba(${Math.round(g[0])},${Math.round(g[1] * 0.8)},${Math.round(g[2])},${0.55 * dark})` : day > 0.5 ? 'rgba(150,156,172,0.45)' : 'rgba(90,80,120,0.4)';
    return { body, belly, dark, day };
  }

  // ---------------------------------------------------------------- silhouettes (facing +x, size = wingspan in px)
  function goose(c, x, y, s, flap, dir, ink, tilt = 0) {
    c.save(); c.translate(x, y); c.rotate(tilt); c.scale(dir, 1);
    const up = Math.sin(flap);                       // −1 wings down … 1 wings up
    c.fillStyle = ink.body; c.strokeStyle = ink.body; c.lineCap = 'round'; c.lineJoin = 'round';
    // far wing (a touch shorter, behind the body)
    c.beginPath(); c.moveTo(s * 0.02, -s * 0.02);
    c.quadraticCurveTo(-s * 0.06, -s * (0.1 + 0.22 * up), -s * 0.12, -s * (0.04 + 0.34 * up));
    c.quadraticCurveTo(-s * 0.02, -s * (0.02 + 0.12 * up), s * 0.1, -s * 0.01); c.fill();
    // body, tail, neck, head, bill
    c.beginPath(); c.ellipse(0, 0, s * 0.3, s * 0.075, -0.04, 0, TAU); c.fill();
    c.beginPath(); c.moveTo(-s * 0.26, -s * 0.01); c.lineTo(-s * 0.38, -s * 0.03); c.lineTo(-s * 0.36, s * 0.035); c.closePath(); c.fill();
    c.lineWidth = s * 0.05; c.beginPath(); c.moveTo(s * 0.22, -s * 0.02); c.quadraticCurveTo(s * 0.42, -s * 0.06, s * 0.52, -s * 0.07); c.stroke();
    c.beginPath(); c.ellipse(s * 0.55, -s * 0.072, s * 0.05, s * 0.034, 0, 0, TAU); c.fill();
    c.lineWidth = s * 0.02; c.beginPath(); c.moveTo(s * 0.59, -s * 0.068); c.lineTo(s * 0.65, -s * 0.06); c.stroke();
    // the belly catching the city's light at night / the sky's by day
    c.strokeStyle = ink.belly; c.lineWidth = Math.max(0.6, s * 0.03);
    c.beginPath(); c.ellipse(0, s * 0.012, s * 0.27, s * 0.06, -0.04, 0.15 * Math.PI, 0.85 * Math.PI); c.stroke();
    // near wing, a long arm with a swept tip
    c.fillStyle = ink.body;
    c.beginPath(); c.moveTo(s * 0.08, -s * 0.03);
    c.quadraticCurveTo(-s * 0.02, -s * (0.16 + 0.3 * up), -s * 0.16, -s * (0.06 + 0.46 * up));
    c.quadraticCurveTo(-s * 0.04, -s * (0.04 + 0.18 * up), s * 0.16, -s * 0.0); c.fill();
    c.restore();
  }
  function swift(c, x, y, s, flap, ang, ink) {
    c.save(); c.translate(x, y); c.rotate(ang);
    const sweep = 0.35 + 0.25 * Math.max(0, Math.sin(flap));      // wings flicker, then hold in a glide
    c.fillStyle = ink.body;
    c.beginPath();
    c.moveTo(s * 0.18, 0);
    c.quadraticCurveTo(s * 0.02, -s * 0.12, -s * 0.2, -s * (0.45 - sweep * 0.2));   // upper wing, swept back like a scythe
    c.quadraticCurveTo(-s * 0.02, -s * 0.06, -s * 0.12, 0);
    c.quadraticCurveTo(-s * 0.02, s * 0.06, -s * 0.2, s * (0.45 - sweep * 0.2));
    c.quadraticCurveTo(s * 0.02, s * 0.12, s * 0.18, 0);
    c.fill();
    c.beginPath(); c.moveTo(-s * 0.12, 0); c.lineTo(-s * 0.3, -s * 0.05); c.lineTo(-s * 0.24, 0); c.lineTo(-s * 0.3, s * 0.05); c.closePath(); c.fill();
    c.restore();
  }
  function pigeonSit(c, x, y, s, p, t, ink) {
    c.save(); c.translate(x, y); c.scale(p.face, 1);
    const peck = p.peck > 0 ? Math.sin(Math.min(1, p.peck) * Math.PI) : 0;
    const bob = p.walk ? Math.abs(Math.sin(t * 9 + p.ph)) * s * 0.06 : 0;
    // tail, body, wing bar, head + neck sheen
    c.fillStyle = ink.body;
    c.beginPath(); c.moveTo(-s * 0.32, -s * 0.28); c.lineTo(-s * 0.62, -s * 0.36); c.lineTo(-s * 0.58, -s * 0.24); c.closePath(); c.fill();
    c.beginPath(); c.ellipse(0, -s * 0.3, s * 0.36, s * 0.22, -0.12, 0, TAU); c.fill();
    const hx = s * (0.3 + 0.12 * peck), hy = -s * (0.5 - 0.3 * peck) + bob;
    c.beginPath(); c.moveTo(s * 0.18, -s * 0.42); c.quadraticCurveTo(s * 0.3, -s * 0.5, hx, hy); c.lineTo(hx - s * 0.04, hy + s * 0.12); c.quadraticCurveTo(s * 0.22, -s * 0.3, s * 0.12, -s * 0.24); c.fill();
    if (ink.head) c.fillStyle = ink.head;
    c.beginPath(); c.arc(hx, hy, s * 0.11, 0, TAU); c.fill();
    c.fillRect(hx + s * 0.09, hy - s * 0.01, s * 0.08, s * 0.035);
    if (ink.day > 0.4) {
      c.fillStyle = 'rgba(120,200,170,0.5)'; c.beginPath(); c.arc(s * 0.22, -s * 0.38, s * 0.07, 0, TAU); c.fill();       // the neck's green sheen
      c.fillStyle = 'rgba(200,205,220,0.35)'; c.fillRect(-s * 0.2, -s * 0.34, s * 0.26, s * 0.035);                          // a pale wing bar
    }
    c.strokeStyle = ink.body; c.lineWidth = Math.max(0.5, s * 0.05);
    c.beginPath(); c.moveTo(-s * 0.04, -s * 0.1); c.lineTo(-s * 0.06, 0); c.moveTo(s * 0.06, -s * 0.1); c.lineTo(s * 0.06, 0); c.stroke();
    c.restore();
  }
  function pigeonFly(c, x, y, s, flap, dir, ink) {
    c.save(); c.translate(x, y); c.scale(dir, 1);
    const up = Math.sin(flap);
    c.fillStyle = ink.body;
    c.beginPath(); c.ellipse(0, 0, s * 0.34, s * 0.12, 0, 0, TAU); c.fill();
    c.beginPath(); c.arc(s * 0.34, -s * 0.04, s * 0.1, 0, TAU); c.fill();
    c.beginPath(); c.moveTo(-s * 0.3, 0); c.lineTo(-s * 0.55, -s * 0.08); c.lineTo(-s * 0.55, s * 0.08); c.closePath(); c.fill();
    for (const [k, len] of [[0.7, 0.42], [1, 0.55]]) {
      c.globalAlpha *= k === 1 ? 1 : 0.85;
      c.beginPath(); c.moveTo(s * 0.06, -s * 0.04);
      c.quadraticCurveTo(-s * 0.04, -s * len * up * 0.7, -s * 0.12, -s * len * up);
      c.quadraticCurveTo(0, -s * len * up * 0.3, s * 0.14, 0); c.fill();
    }
    c.restore();
  }
  function heronDraw(c, x, y, s, flap, dir, ink) {
    c.save(); c.translate(x, y); c.scale(dir, 1);
    const up = Math.sin(flap);
    c.fillStyle = ink.body; c.strokeStyle = ink.body; c.lineCap = 'round';
    // legs trailing far behind, the neck folded into an S, the dagger bill
    c.lineWidth = s * 0.018; c.beginPath(); c.moveTo(-s * 0.18, s * 0.02); c.lineTo(-s * 0.6, s * 0.05); c.moveTo(-s * 0.18, s * 0.035); c.lineTo(-s * 0.58, s * 0.075); c.stroke();
    c.beginPath(); c.ellipse(0, 0, s * 0.22, s * 0.06, 0.05, 0, TAU); c.fill();
    c.lineWidth = s * 0.05; c.beginPath(); c.moveTo(s * 0.16, -s * 0.02); c.bezierCurveTo(s * 0.26, -s * 0.12, s * 0.12, -s * 0.14, s * 0.24, -s * 0.12); c.stroke();
    c.beginPath(); c.ellipse(s * 0.27, -s * 0.12, s * 0.045, s * 0.03, 0, 0, TAU); c.fill();
    c.lineWidth = s * 0.016; c.beginPath(); c.moveTo(s * 0.3, -s * 0.12); c.lineTo(s * 0.42, -s * 0.105); c.stroke();
    // broad, bowed wings, slow beats
    for (const [len, a] of [[0.46, 0.8], [0.6, 1]]) {
      c.globalAlpha = a;
      c.beginPath(); c.moveTo(s * 0.1, -s * 0.03);
      c.bezierCurveTo(s * 0.06, -s * len * (0.3 + 0.5 * up), -s * 0.16, -s * len * (0.4 + 0.6 * up), -s * 0.26, -s * len * (0.15 + 0.75 * up));
      c.bezierCurveTo(-s * 0.12, -s * len * (0.1 + 0.3 * up), -s * 0.02, -s * 0.0, s * 0.14, s * 0.01); c.fill();
    }
    c.globalAlpha = 1;
    c.restore();
  }

  // ---------------------------------------------------------------- when
  const month = L => (L.local && L.local.m) || 1;
  const migrating = L => { const m = month(L); return m === 3 || m === 4 ? 'north' : m >= 9 && m <= 11 ? 'south' : null; };
  const rough = L => L.storm || L.rain > 0.6 || L.fog > 0.7;

  function newGeese(L, forced) {
    const dirN = migrating(L) || (forced ? (Math.random() < 0.5 ? 'north' : 'south') : null);
    if (!dirN) return null;
    const n = 9 + Math.floor(Math.random() * 9);
    const lr = Math.random() < 0.5 ? 1 : -1;                     // the lateral drift (flyways run NE–SW)
    const birds = [];
    const armA = Math.ceil((n - 1) / 2) + (Math.random() < 0.5 ? 1 : -1), armB = n - 1 - armA;
    birds.push({ i: 0, arm: 0, ph: 0 });
    for (let i = 1; i <= armA; i++) birds.push({ i, arm: -1, ph: i * 0.55 });
    for (let i = 1; i <= armB; i++) birds.push({ i, arm: 1, ph: i * 0.55 + 0.25 });
    for (const b of birds) { b.jx = (Math.random() - 0.5) * 0.25; b.jy = (Math.random() - 0.5) * 0.2; b.fr = 2.3 + Math.random() * 0.3; }
    // a straggler: lagging behind one arm, flapping harder to catch up
    if (Math.random() < 0.45) birds.push({ i: Math.max(armA, armB) + 2.5, arm: Math.random() < 0.5 ? -1 : 1, ph: 0.3, jx: 0.4, jy: 0.3, fr: 3.4, strag: true });
    // fall: from near the top, receding toward the horizon (smaller, hazier); spring: out of the haze toward us, leaving overhead
    const south = dirN === 'south';
    const y0 = south ? HZ * (0.08 + Math.random() * 0.1) : HZ * (0.55 + Math.random() * 0.1);
    const y1 = south ? HZ * (0.5 + Math.random() * 0.1) : -HZ * 0.12;
    const x0 = lr > 0 ? W * (-0.15 + Math.random() * 0.2) : W * (0.95 + Math.random() * 0.2);
    const x1 = x0 + lr * W * (0.75 + Math.random() * 0.4);
    return { k: 0, dur: 30 + Math.random() * 14, birds, south, lr, x0, y0, x1, y1, s0: south ? 1.25 : 0.35, s1: south ? 0.4 : 1.35 };
  }

  const api = {
    resize(w, h, hz) { W = w; H = h; HZ = hz; K = Math.max(0.9, Math.min(1.4, w / 390)); flockKey = ''; },
    sky(c, s) {
      const { L, P, dt, t, motion, force } = s;
      const sec = dt / 1000;
      if (!motion) return;
      const ink = inks(L, P);
      // geese
      if (!geese && ((force.has('geese') && !s.geeseDone) || (migrating(L) && !rough(L) && (nextGeese -= sec) <= 0))) {
        s.geeseDone = true; nextGeese = 160 + Math.random() * 260;
        geese = newGeese(L, force.has('geese'));
      }
      if (geese) {
        const g = geese;
        g.k += sec / g.dur;
        const u = ease(Math.min(1, g.k));
        const cx = g.x0 + (g.x1 - g.x0) * u, cy = g.y0 + (g.y1 - g.y0) * u + Math.sin(g.k * 5) * 6;
        const sc = (g.s0 + (g.s1 - g.s0) * u) * K;
        const size = 13 * sc;                                       // wingspan
        // the V points the way it flies (on screen: mostly sideways, a little up or down)
        const vx = g.x1 - g.x0, vy = g.y1 - g.y0, len = Math.hypot(vx, vy), fx = vx / len, fy = vy / len;
        const spread = 0.6;                                          // the V's half-angle (radians)
        const fade = Math.min(1, g.k / 0.06, (1 - g.k) / 0.08) * (g.south ? 1 - 0.55 * u : 0.5 + 0.5 * u);
        c.globalAlpha = Math.max(0, fade);
        for (const b of g.birds) {
          const back = b.i * size * 0.95, side = b.arm * Math.tan(spread) * back;
          const bx = cx - fx * back - fy * side + (b.jx + Math.sin(t * 0.7 + b.ph) * 0.12) * size;
          const by = cy - fy * back + fx * side + (b.jy + Math.cos(t * 0.9 + b.ph) * 0.1) * size;
          const flap = t * TAU * (b.strag ? b.fr : b.fr * 0.5) - b.ph * 1.4;      // the beat ripples back down the arms
          goose(c, bx + (b.strag ? -fx * size * 1.2 * Math.max(0, 1 - g.k * 1.6) : 0), by, size, flap, Math.sign(vx) || 1, ink, Math.atan2(vy, Math.abs(vx)) * 0.6 * Math.sign(vx));
        }
        c.globalAlpha = 1;
        if (g.k >= 1) geese = null;
      }
      // the heron: a slow crossing near the moon (spring to autumn nights)
      const m = month(L), warm = m >= 4 && m <= 10;
      if (!heron && ((force.has('heron') && !s.heronDone) || (warm && ink.dark > 0.6 && s.moonAt && !rough(L) && (nextHeron -= sec) <= 0))) {
        s.heronDone = true; nextHeron = 700 + Math.random() * 900;
        const mo = s.moonAt || { x: W * 0.6, y: HZ * 0.2, r: 20 };
        const dir = Math.random() < 0.5 ? 1 : -1;
        heron = { k: 0, dir, y: mo.y + (Math.random() - 0.3) * mo.r * 1.2, ph: Math.random() * TAU };
      }
      if (heron) {
        heron.k += sec / 26;
        const x = heron.dir > 0 ? -60 + heron.k * (W + 120) : W + 60 - heron.k * (W + 120);
        const y = heron.y + Math.sin(heron.k * 6) * 4 - heron.k * 10;
        c.globalAlpha = Math.min(1, heron.k / 0.05, (1 - heron.k) / 0.05);
        heronDraw(c, x, y, 34 * K, t * TAU * 0.55 + heron.ph, heron.dir, ink);
        c.globalAlpha = 1;
        if (heron.k >= 1) heron = null;
      }
    },
    /** swifts over the far rows on summer evenings */
    low(c, s) {
      const { L, P, dt, t, motion, force } = s;
      if (!motion) return;
      const sec = dt / 1000;
      const evening = L.w.golden + L.w.dawn * 0.4 + (L.w.night > 0.2 && L.w.night < 0.7 ? 0.4 : 0);
      const summer = (L.season.summer || 0) > 0.45;
      if (!swifts && ((force.has('swifts') && !s.swiftsDone) || (summer && evening > 0.3 && !L.rain && (nextSwifts -= sec) <= 0))) {
        s.swiftsDone = true; nextSwifts = 90 + Math.random() * 150;
        const n = 5 + Math.floor(Math.random() * 6), dir = Math.random() < 0.5 ? 1 : -1;
        swifts = { k: 0, dur: 16 + Math.random() * 8, dir, y: HZ * (0.42 + Math.random() * 0.16), birds: Array.from({ length: n }, () => ({ a: Math.random() * 3, b: Math.random() * TAU, r: 30 + Math.random() * 70, fq: 0.8 + Math.random() * 0.9, ph: Math.random() * TAU })) };
      }
      if (!swifts) return;
      const ink = inks(L, P);
      swifts.k += sec / swifts.dur;
      const cx = swifts.dir > 0 ? -120 + swifts.k * (W + 240) : W + 120 - swifts.k * (W + 240);
      c.globalAlpha = Math.min(1, swifts.k / 0.08, (1 - swifts.k) / 0.08);
      for (const b of swifts.birds) {
        // looping, banking dashes round a centre that sweeps across the rooftops
        const tt = t * b.fq + b.ph;
        const x = cx + Math.sin(tt * 1.7 + b.a) * b.r * K * 1.4, y = swifts.y + Math.sin(tt * 2.3 + b.b) * b.r * 0.5 * K;
        const vx = Math.cos(tt * 1.7 + b.a) * 1.7 * 1.4, vy = Math.cos(tt * 2.3 + b.b) * 2.3 * 0.5;
        swift(c, x, y, 11 * K, t * 26 + b.ph, Math.atan2(vy, vx + swifts.dir * 0.6), ink);
      }
      c.globalAlpha = 1;
      if (swifts.k >= 1) swifts = null;
    },
    /** pigeons on a near roof (by day, dry): g = the near layer's roofs */
    mid(c, s, g) {
      const { L, P, dt, t, motion, force } = s;
      const sec = dt / 1000;
      const day = clamp01(L.w.day + L.w.dawn * 0.6 + L.w.golden * 0.5);
      const want = force.has('pigeons') || (day > 0.45 && !(L.rain > 0.4) && !L.storm && L.snow < 0.6);
      if (!want) { if (flock && flock.st !== 'away') flock = null; if (!flock) return; }
      const key = `${W}|${HZ}|${g.roofs.length}`;
      if (!flock || flockKey !== key) {
        flockKey = key;
        // a roof at one side of the view, clear of the sign above, wide enough for a row of them
        const R = rng(((L.local && L.local.d) || 3) * 17 + 5);
        const spots = g.roofs.filter(r => r.w > 34 && g.top + r.y > HZ * 0.5 && g.top + r.y < HZ - 30 && ((r.x - g.margin > W * 0.04 && r.x - g.margin + r.w < W * 0.4) || (r.x - g.margin > W * 0.6 && r.x - g.margin + r.w < W * 0.96)));
        if (!spots.length) return;
        const r = spots[Math.floor(R() * spots.length)];
        const n = 3 + Math.floor(R() * 4);
        flock = { r, st: 'sit', k: 0, birds: Array.from({ length: n }, (_, i) => ({ u: 0.15 + (i + R() * 0.6) / n * 0.7, face: R() < 0.5 ? 1 : -1, peck: 0, walk: false, ph: R() * TAU, next: 1 + R() * 4, fly: null })) };
      }
      const f = flock, sz = 10.5 * K;
      // pigeons by day: blue-grey with a darker head (silhouettes once the light goes)
      const base = inks(L, P), ink = base.day > 0.4 ? { ...base, body: 'rgba(92,98,118,0.98)', head: 'rgba(58,62,78,1)' } : base;
      const roofX = gx => g.ox + f.r.x + f.r.w * gx, roofY = g.oy + f.r.y + 0.5;
      // now and then the whole flock goes up on its own, wheels round the block and comes back
      if (motion && f.st === 'sit' && (nextLoop -= sec) <= 0) { nextLoop = 150 + Math.random() * 200; api.scare(true); }
      if (f.st === 'sit') {
        for (const b of f.birds) {
          if (motion) {
            b.next -= sec;
            if (b.peck > 0) { b.peck += sec * 3.2; if (b.peck > 1) b.peck = 0; }
            if (b.walk) { b.u += b.face * sec * 0.03; if (b.u < 0.08 || b.u > 0.92) b.face *= -1; b.walkT -= sec; if (b.walkT <= 0) b.walk = false; }
            if (b.next <= 0) {
              const r = Math.random();
              if (r < 0.45) b.peck = 0.001; else if (r < 0.7) { b.walk = true; b.walkT = 0.6 + Math.random() * 1.2; } else b.face *= -1;
              b.next = 1.2 + Math.random() * 4;
            }
          }
          pigeonSit(c, roofX(b.u), roofY, sz, b, t, ink);
        }
        f.at = { x: roofX(0.5), y: roofY - sz * 0.4, w: f.r.w * 0.8 };
      } else {
        // up and away: each bird climbs off the roof, swings round a wide loop, and (after a while) glides back in
        f.k += sec;
        let home = 0;
        for (const b of f.birds) {
          const T0 = b.fly.delay, tt = f.k - T0;
          if (tt < 0) { pigeonSit(c, roofX(b.u), roofY, sz, b, t, ink); continue; }
          const loop = b.fly.loop, total = loop + 1.6;
          const p = Math.min(1, tt / total);
          let x, y, dir;
          // a loop out to one side and back over the roof, then the glide down onto it
          const rx = W * 0.3, ry = HZ * 0.11;
          const hx = roofX(b.u), hy = roofY - sz * 0.3, top = hy - ry * 0.6 - 12;
          if (tt < loop) {
            const a = (tt / loop) * TAU;
            const climb = Math.min(1, tt / 0.7);
            x = hx + b.fly.side * rx * (1 - Math.cos(a)) * climb;
            y = hy + (top - hy) * climb - Math.sin(a) * ry * climb;
            dir = Math.sign(b.fly.side * Math.sin(a)) || b.fly.side;
          } else {
            const q = ease((tt - loop) / 1.6);
            x = hx + (b.fly.side * 18) * (1 - q); y = top + (hy - top) * q; dir = -b.fly.side;
          }
          if (p >= 1) { home++; pigeonSit(c, roofX(b.u), roofY, sz, b, t, ink); continue; }
          pigeonFly(c, x, y, sz * 1.1, t * TAU * 5.5 + b.ph, dir, ink);
        }
        if (home === f.birds.length) { f.st = 'sit'; f.k = 0; for (const b of f.birds) b.fly = null; }
      }
    },
    /** a tap: the pigeons burst into flight. Returns 'pigeons' or null. */
    hit(x, y) {
      if (flock && flock.st === 'sit' && flock.at && Math.abs(x - flock.at.x) < Math.max(36, flock.at.w * 0.7) && Math.abs(y - flock.at.y) < 30) { api.scare(false); return 'pigeons'; }
      return null;
    },
    scare(calm) {
      if (!flock || flock.st !== 'sit') return;
      flock.st = 'fly'; flock.k = 0;
      const side = flock.at && flock.at.x < W / 2 ? 1 : -1;          // out over the middle of the view, then back
      for (const b of flock.birds) b.fly = { delay: Math.random() * (calm ? 0.8 : 0.25), loop: (calm ? 9 : 7) + Math.random() * 3, side };
    },
    debug: () => ({ geese: !!geese, heron: !!heron, swifts: !!swifts, pigeons: flock ? flock.st : null }),
  };
  return api;
}
