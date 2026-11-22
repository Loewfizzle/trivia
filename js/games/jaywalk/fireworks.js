// JAYWALK — NEW YEAR'S FIREWORKS (JT1 — docs/jaywalk.md "JT1 — SEASONS"; the owner, Nov 22): part of THE SEASONAL PACK, fetched only on the
// game day Dec 31 or Jan 1 (seasonal.js). Bursts over the SKYLINE — the backdrop band at the top of the screen, NEVER over the lanes: their own
// small canvas inside the skyline's picture layer (it slides with the picture), drawn in one pass a frame (no draw call of the 3D scene's).
// Rockets rise with a faint trail, burst into neon sparks that droop + fade (some crackle at their end), a soft flash + its glow on the water
// at the band's foot. Dec 31 ('eve'): regular bursts all run, the FINALE in the last 3 minutes before LOCAL midnight (the phone's clock — the
// lab's &clock=HH:MM), strongest by night; by day fewer, softer, a little smoke. Jan 1 ('day'): light bursts, by night only. Reduce motion:
// none. THE SOUNDS (sounds.js — pops · crackle · volley): only as a burst opens on screen, never the same one twice running, a few seconds
// apart, under the game's own sounds (sfx.js keeps the music / sound switches).
export const FW = Object.freeze({
  finaleMin: 3,                                   // (the finale: the last 3 minutes before local midnight, the eve only)
  rate: { eve: [0.5, 0.17], finale: [2.4, 0.6], day: [0.14, 0] },   // (bursts a second: [night, day])
  gapS: [3.2, 6.5], gapFinaleS: [1.7, 3.2],       // (the sounds' gaps — random in the range)
  sounds: ['firework-pops', 'firework-crackle', 'firework-volley'],
  max: 1100,                                      // (sparks alive at once)
});
const HEX = ['#ff3fb4', '#29d8ff', '#ffd23a', '#a05bff', '#7dff9a', '#ff6a3a', '#ffffff'];
/** is it the finale (the eve, the last FW.finaleMin minutes before local midnight)? `min` = minutes after local midnight */
export const finaleOf = (kind, min) => kind === 'eve' && min >= 1440 - FW.finaleMin;

export function createFireworks({ host, reduce = false, sound = () => {}, rnd = Math.random }) {
  const cv = document.createElement('canvas');
  cv.className = 'jw-fw'; cv.setAttribute('aria-hidden', 'true');
  cv.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;';
  if (host) host.append(cv);
  let c2 = null, W = 0, H = 0, k = 1, vis = 0.66, kind = '', resting = false, dirty = false, nextAt = 0, soundAt = 0, lastId = '', t = 0, shown = 0, bursts = 0, sounds = 0;
  try { c2 = cv.getContext('2d'); } catch { c2 = null; }
  // (the canvas follows its box — a ResizeObserver, never a layout read in the frame — at ≤ 1.5× and ≤ ~0.35 MP: soft lights need no more)
  let ro = null;
  try { ro = new ResizeObserver(es => { const r = es[0] && es[0].contentRect; if (r && r.width) size(r.width, r.height); }); ro.observe(host); } catch { /* no observer: the default size */ size(640, 216); }
  function size(w, h) { vis = Math.max(0.3, Math.min(1, (window.innerWidth || w) / Math.max(1, w))); k = Math.min(1.5, window.devicePixelRatio || 1, Math.sqrt(350000 / Math.max(1, w * h))); W = Math.max(1, Math.round(w * k)); H = Math.max(1, Math.round(h * k)); if (!resting) { cv.width = W; cv.height = H; } dirty = true; }   // (JT2: a resize behind a final screen never makes the freed canvas again)   // (vis: the share of the picture's width on screen — it is wider than the phone)
  // the sparks: x, y, vx, vy (canvas px · px/s), age, life (s), colour, kind (0 spark · 1 rocket · 2 flash · 3 smoke)
  const N = FW.max, P = new Float32Array(N * 8);
  let n = 0;
  const add = (x, y, vx, vy, life, col, kd) => { if (n >= N) return; const o = n++ * 8; P[o] = x; P[o + 1] = y; P[o + 2] = vx; P[o + 3] = vy; P[o + 4] = 0; P[o + 5] = life; P[o + 6] = col; P[o + 7] = kd; };
  // a soft round light, drawn once per colour (the flashes + the glow on the water)
  const glows = HEX.map(hx => { const g = document.createElement('canvas'); g.width = g.height = 64; const q = g.getContext('2d'); if (q) { const gr = q.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, hx); gr.addColorStop(0.35, hx + '66'); gr.addColorStop(1, hx + '00'); q.fillStyle = gr; q.fillRect(0, 0, 64, 64); } return g; });
  const pending = [];   // (rockets on their way up: [x, y top, colour, when it bursts, big])
  function launch(day, big) {
    const x = W * (0.5 + (rnd() - 0.5) * vis * 0.84), top = H * (0.1 + 0.3 * rnd()), col = Math.floor(rnd() * HEX.length), up = 0.55 + 0.45 * rnd();
    add(x, H * 0.92, (rnd() - 0.5) * W * 0.02, -(H * 0.92 - top) / up, up, col, 1);
    pending.push([x, top, col, t + up, big, day]);
  }
  function open(x, y, col, big, day) {
    const m = Math.round((big ? 78 : 54) * (day ? 0.6 : 1)), sp = H * (big ? 0.42 : 0.3), two = rnd() < 0.35 ? Math.floor(rnd() * HEX.length) : col;
    for (let j = 0; j < m; j++) { const a = (j / m) * Math.PI * 2 + rnd() * 0.2, v = sp * (0.55 + 0.45 * rnd()); add(x, y, Math.cos(a) * v, Math.sin(a) * v, 1.1 + rnd() * 0.8, j % 3 === 0 ? two : col, 0); }
    add(x, y, 0, 0, 0.45, col, 2);
    if (day) for (let j = 0; j < 5; j++) add(x + (rnd() - 0.5) * H * 0.2, y + (rnd() - 0.5) * H * 0.12, (rnd() - 0.5) * 6, 4, 2.6, 6, 3);
    bursts++;
    if (t >= soundAt) {
      const fin = pending.length > 2 || big, [g0, g1] = fin ? FW.gapFinaleS : FW.gapS;
      const pick = FW.sounds.filter(s => s !== lastId), id = pick[Math.floor(rnd() * pick.length)];
      lastId = id; soundAt = t + g0 + (g1 - g0) * rnd(); sounds++;
      try { sound(id); } catch { /* audio is polish */ }
    }
  }
  return {
    el: cv,
    /** the run's fireworks: 'eve' · 'day' · '' (none: the canvas cleared) */
    on(kd) { kind = reduce ? '' : kd || ''; n = 0; pending.length = 0; nextAt = 0; soundAt = 0; lastId = ''; if (!kind) clear(); },
    /** one frame: the scene's clock (ms), dt (ms), the look, the phone's local minutes after midnight */
    frame(clock, dt, day, min) {
      if (!c2 || resting) return;
      t = clock / 1000;
      const fin = finaleOf(kind, min), R = kind ? (fin ? FW.rate.finale : kind === 'eve' ? FW.rate.eve : FW.rate.day)[day ? 1 : 0] : 0;
      if (R > 0) {
        if (!nextAt) nextAt = t + 0.6;
        while (t >= nextAt) { launch(day, fin && rnd() < 0.5); nextAt += (0.4 + 1.2 * rnd()) / R; if (fin && rnd() < 0.3) launch(day, false); }
      }
      for (let j = pending.length - 1; j >= 0; j--) { const q = pending[j]; if (t >= q[3]) { pending.splice(j, 1); open(q[0], q[1], q[2], q[4], q[5]); } }
      if (!n) { if (dirty) clear(); return; }
      const s = Math.min(0.05, Math.max(0, dt / 1000)), g = H * 0.32;
      c2.setTransform(1, 0, 0, 1, 0, 0);
      c2.clearRect(0, 0, W, H);
      c2.globalCompositeOperation = day ? 'source-over' : 'lighter'; c2.lineCap = 'round';
      let live = 0;
      for (let j = 0; j < n; j++) {
        const o = j * 8;
        P[o + 4] += s;
        const u = P[o + 4] / P[o + 5];
        if (u >= 1) continue;
        const kd = P[o + 7];
        if (kd === 0) { P[o + 2] *= 1 - 1.7 * s; P[o + 3] = P[o + 3] * (1 - 1.7 * s) + g * s; }
        else if (kd === 3) { P[o + 3] *= 1 - 0.5 * s; }
        P[o] += P[o + 2] * s; P[o + 1] += P[o + 3] * s;
        const x = P[o], y = P[o + 1], col = P[o + 6] | 0;
        if (kd === 2) {   // the flash + its glow on the water (the band's foot)
          const a = (1 - u) * (day ? 0.35 : 0.9), r = H * 0.34 * (0.6 + 0.6 * u);
          c2.globalAlpha = a; c2.drawImage(glows[col], x - r, y - r, r * 2, r * 2);
          c2.globalAlpha = a * (day ? 0.25 : 0.5); c2.drawImage(glows[col], x - H * 0.36, H * 0.86, H * 0.72, H * 0.12);
        } else if (kd === 3) {
          c2.globalAlpha = 0.2 * (1 - u); c2.fillStyle = '#c9ccd4'; const r = H * (0.03 + 0.05 * u); c2.fillRect(x - r, y - r, r * 2, r * 2);
        } else {
          const tw = kd === 0 && u > 0.7 && P[o + 5] > 1.5 ? (Math.sin(clock * 0.05 + j) > 0 ? 1 : 0.25) : 1;   // (the long-lived ones crackle at their end)
          c2.globalAlpha = (kd === 1 ? 0.7 : (1 - u) * (1 - u * 0.3)) * tw * (day ? 0.9 : 1);
          c2.strokeStyle = kd === 1 ? '#ffe9c0' : HEX[col];
          c2.lineWidth = (kd === 1 ? 1.1 : 1.5) * k * (day ? 1.9 : 1);   // (by day bolder: a thin line vanishes on a bright sky)
          const tl = kd === 1 ? 0.09 : 0.045 + 0.05 * (1 - u);   // (a short soft streak behind it: its own speed — the rocket's trail longer)
          c2.beginPath(); c2.moveTo(x - P[o + 2] * tl, y - P[o + 3] * tl); c2.lineTo(x, y); c2.stroke();
        }
        live++;
        if (j !== live - 1) P.copyWithin((live - 1) * 8, o, o + 8);
      }
      n = live; c2.globalAlpha = 1; c2.globalCompositeOperation = 'source-over'; dirty = true; shown = n;
    },
    /** the end screen covers it (JT2's add-on — THE FINAL SCREEN's MEMORY): its pixels FREED (the canvas 0 × 0, no spark, no rocket) — made again on the way back */
    rest(on) { resting = !!on; if (on) { clear(); n = 0; pending.length = 0; cv.width = cv.height = 0; } else if (!cv.width && W) { cv.width = W; cv.height = H; } },
    info: () => ({ kind, sparks: shown, bursts, sounds, last: lastId, w: W, h: H, px: cv.width * cv.height, resting }),
    destroy() { if (ro) ro.disconnect(); clear(); cv.width = cv.height = 0; cv.remove(); },
  };
  function clear() { if (c2) c2.clearRect(0, 0, W, H); dirty = false; shown = 0; }
}
