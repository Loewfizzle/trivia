// LIVING CITY — the street and the rails (district/scene.js draws them; the clock and weather come from core/sky.js#look).
//   train(c, s, mid)    after the mid row: an elevated line on its viaduct; every few minutes a train crosses (rush hours more
//                       often, none in the small hours) — lit windows after dark, silver by day, a headlight, a tail light and
//                       now and then a blue spark off the rail. The near towers hide it at the sides, so it's seen in the gaps.
//   steam(c, s, near)   after the near row: steam from rooftop vents when it's cold (live temperature, else the season),
//                       drifting with the real wind, lit by the neon at night
//   traffic(c, s)       on the street at the towers' feet: headlights one way, tail lights the other, their light pooled and
//                       streaked on the wet street; by day small cars catching the light. The flow follows the clock: the
//                       morning and evening rush, a stray cab at 3 am.
// Force in a preview: &force=train,steam,rush.

const TAU = Math.PI * 2;
const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; };
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

  return {
    resize(w, h, hz) { if (w === W && h === H && hz === HZ) return; W = w; H = h; HZ = hz; K = Math.max(0.9, Math.min(1.4, w / 390)); cars = []; trains = []; puffs = []; viaKey = ''; ventKey = ''; },   // same size: keep the traffic
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
    /** cars at the towers' feet, their light on the wet street */
    traffic(c, s, streak) {
      const { L, dt, t, motion, force, tier } = s;
      if (!motion) return;
      const sec = dt / 1000, hr = hourOf(L);
      // PARTY NIGHTS: more cars and cabs, a few with a soft neon underglow in the party's colours (never loud: the dock is just below)
      const party = s.party && s.party.on > 0 ? s.party : null;
      const flow = Math.min(1, (force.has('rush') ? 1 : trafficAt(hr, L.local ? L.local.dow : 3)) * (party ? 1 + 0.7 * party.ramp * (0.6 + 0.4 * party.energy) : 1));
      const want = Math.round(flow * (tier === 0 ? 6 : 12) * K);
      if (cars.length < want && Math.random() < sec * (0.6 + flow * 2.5)) {
        const lane = Math.random() < 0.5 ? 0 : 1;                // 0: the far lane (tail lights, going right), 1: near (head lights, going left)
        const dir = lane === 0 ? 1 : -1;
        const pal = party && s.party.palette ? s.party.palette : null;
        const under = party && pal && Math.random() < 0.35 * party.ramp ? pal[Math.floor(Math.random() * pal.length)] : null;
        cars.push({ lane, dir, x: dir > 0 ? -30 : W + 30, v: (40 + Math.random() * 30) * K * dir, cab: Math.random() < (party ? 0.2 : 0.12), ph: Math.random() * TAU, under });
      }
      const dark = clamp01(L.w.night + L.w.late + L.w.golden * 0.7 + L.w.dawn * 0.5 + (L.rain ? 0.3 : 0));
      const wet = L.rain ? 1 : 0.55;
      cars = cars.filter(car => {
        car.x += car.v * sec;
        const y = HZ + (car.lane === 0 ? 3.2 : 7.6) * K;
        const sc = car.lane === 0 ? 0.85 : 1;
        // the body (seen at night only as a dark shape between its lights; by day a small car catching the light)
        const bw = 13 * K * sc, bh = 4.2 * K * sc;
        c.fillStyle = car.cab ? (dark > 0.5 ? 'rgba(60,46,10,0.9)' : 'rgba(214,170,40,0.95)') : dark > 0.5 ? 'rgba(10,10,20,0.92)' : 'rgba(60,66,84,0.92)';
        c.fillRect(car.x - bw / 2, y - bh, bw, bh);
        c.fillRect(car.x - bw * 0.28, y - bh * 1.6, bw * 0.56, bh * 0.7);
        if (dark < 0.5) { c.fillStyle = 'rgba(230,236,250,0.6)'; c.fillRect(car.x - bw * 0.24, y - bh * 1.5, bw * 0.48, bh * 0.25); }
        if (dark > 0.2) {
          c.globalCompositeOperation = 'lighter';
          const front = car.x + car.dir * bw * 0.5, back = car.x - car.dir * bw * 0.5;
          // headlights face the way it goes; we see the near lane's fronts and the far lane's backs
          const seeFront = car.lane === 1;
          const lx = seeFront ? front : back, col = seeFront ? [255, 244, 214] : [255, 40, 60];
          c.globalAlpha = dark * (seeFront ? 0.95 : 0.85);
          c.drawImage(glow(col), lx - 5 * sc, y - bh * 0.6 - 5 * sc, 10 * sc, 10 * sc);
          c.drawImage(glow(col), lx - car.dir * 0 - 5 * sc + (seeFront ? -car.dir : car.dir) * 3.2 * K * sc, y - bh * 0.6 - 5 * sc, 10 * sc, 10 * sc);
          if (seeFront) { c.globalAlpha = 0.25 * dark; c.drawImage(glow([255, 240, 210]), front + (car.dir > 0 ? 0 : -46 * K), y - 6, 46 * K, 9); }
          if (car.cab) { c.globalAlpha = 0.8 * dark; c.drawImage(glow([255, 214, 90]), car.x - 3, y - bh * 1.9 - 3, 6, 6); }
          // the neon underglow (PARTY NIGHTS): a soft pool of colour under the car, breathing with the city
          if (car.under && party) { const ug = 0.34 * dark * party.ramp * (0.75 + 0.25 * party.breath); c.globalAlpha = ug; c.drawImage(glow(car.under), car.x - bw * 0.9, y - bh * 0.9, bw * 1.8, bh * 1.8); c.globalAlpha = ug * 0.5; if (streak) streak(car.x, bw * 0.9, (H - HZ) * 0.22 * wet, `rgb(${car.under.join(',')})`, 0.1 * dark * wet * party.ramp, t, car.ph + 1); }
          // its light streaked down the wet street
          c.globalAlpha = 1;
          if (streak) streak(lx, 7 * sc, (H - HZ) * 0.35 * wet, seeFront ? '#fff1d6' : '#ff3046', (seeFront ? 0.16 : 0.12) * dark * wet, t, car.ph);
          c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
        }
        return car.x > -50 && car.x < W + 50;
      });
    },
    debug: () => ({ cars: cars.length, trains: trains.length, puffs: puffs.length }),
  };
}
