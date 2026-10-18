// THE BOARD's hall: the back of the speakeasy, painted once in Canvas 2D (and again only when the size changes).
// Dark mahogany panelling with brass rails, tall Art Deco windows onto the night city (the title's own still when
// there is one, a painted skyline otherwise), a back bar of bottles lit from below, brass pendant lamps spilling warm
// light, the polished counter, haze and a vignette. Nothing animates in here: the slow camera drift, the dust and the
// game-coloured lighting are compositor layers in css/board.css.
import { rngFrom } from '../core/rng.js';

const TAU = Math.PI * 2;

export function createHall(canvas, { still = null } = {}) {
  const ctx = canvas.getContext('2d', { alpha: false });
  let size = { w: 0, h: 0, dpr: 1 };

  function resize(w, h) {
    const dpr = Math.min(2, window.devicePixelRatio || 1) * (w * h > 1.6e6 ? 0.85 : 1);
    if (Math.abs(w - size.w) < 2 && Math.abs(h - size.h) < 2 && dpr === size.dpr) return;
    size = { w, h, dpr };
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    paint(ctx, w, h, still);
  }

  return {
    resize,
    destroy() { canvas.width = canvas.height = 0; },
    info: () => ({ ...size }),
  };
}

// ------------------------------------------------------------------ the painting
function paint(x, W, H, still) {
  const R = rngFrom('the-board-hall');
  const wide = W >= 900;
  const wallBottom = H * (wide ? 0.74 : 0.7);

  // base
  let g = x.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#07040a'); g.addColorStop(0.5, '#0d0709'); g.addColorStop(1, '#040205');
  x.fillStyle = g; x.fillRect(0, 0, W, H);

  // the windows (behind the panelling's openings)
  const wins = wide
    ? [{ cx: W * 0.115, w: Math.min(250, W * 0.15) }, { cx: W * 0.885, w: Math.min(250, W * 0.15) }]
    : [{ cx: W * 0.5, w: Math.min(W * 0.62, 300) }];
  const winTop = wide ? H * 0.1 : Math.max(18, H * 0.035);
  const winBot = wide ? H * 0.6 : H * 0.36;
  for (const w of wins) drawWindow(x, w.cx - w.w / 2, winTop, w.w, winBot - winTop, still, R);

  // the panelling around them
  drawPanels(x, W, wallBottom, wins, winTop, winBot, R);

  // the back bar: shelves of bottles lit from below
  drawBackBar(x, W, H, wallBottom, wide, R);

  // brass pendants and their light
  const lamps = wide ? [0.27, 0.73] : [0.075, 0.925];
  for (const lx of lamps) drawPendant(x, W * lx, wide ? H * 0.12 : H * 0.05, wide ? 1 : 0.7, H);

  // the counter
  drawCounter(x, W, H);

  // haze: warm low light, a breath of magenta and blue from the windows
  blob(x, W * 0.5, H * 0.45, Math.max(W, H) * 0.6, 'rgba(255,170,90,0.07)');
  blob(x, W * 0.2, H * 0.75, Math.max(W, H) * 0.35, 'rgba(255,90,180,0.045)');
  blob(x, W * 0.82, H * 0.3, Math.max(W, H) * 0.35, 'rgba(90,150,255,0.05)');

  // vignette
  g = x.createRadialGradient(W / 2, H * 0.45, Math.min(W, H) * 0.25, W / 2, H * 0.5, Math.max(W, H) * 0.78);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.72)');
  x.fillStyle = g; x.fillRect(0, 0, W, H);
}

function blob(x, cx, cy, r, color) {
  const g = x.createRadialGradient(cx, cy, 0, cx, cy, r);
  g.addColorStop(0, color); g.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = g; x.fillRect(cx - r, cy - r, r * 2, r * 2);
}

function archPath(x, l, t, w, h) {
  const r = w / 2;
  x.beginPath();
  x.moveTo(l, t + h);
  x.lineTo(l, t + r);
  x.arc(l + r, t + r, r, Math.PI, 0);
  x.lineTo(l + w, t + h);
  x.closePath();
}

function drawWindow(x, l, t, w, h, still, R) {
  x.save();
  archPath(x, l, t, w, h);
  x.clip();
  // the night outside
  let g = x.createLinearGradient(0, t, 0, t + h);
  g.addColorStop(0, '#060818'); g.addColorStop(0.6, '#120f2c'); g.addColorStop(1, '#1d1236');
  x.fillStyle = g; x.fillRect(l, t, w, h);
  if (still && still.width) {
    // the city the title just showed, cropped to the lit middle of the skyline
    const sw = still.width, sh = still.height;
    const scale = Math.max(w / (sw * 0.55), h / (sh * 0.7));
    const dw = sw * scale, dh = sh * scale;
    x.globalAlpha = 0.85;
    x.drawImage(still, l + w / 2 - dw / 2, t + h - dh * 0.92, dw, dh);
    x.globalAlpha = 1;
  } else {
    skyline(x, l, t, w, h, R);
  }
  // cool glass, a reflection, rain
  g = x.createLinearGradient(l, t, l + w, t + h);
  g.addColorStop(0, 'rgba(120,160,255,0.10)'); g.addColorStop(0.45, 'rgba(255,255,255,0.05)'); g.addColorStop(0.5, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(40,20,80,0.25)');
  x.fillStyle = g; x.fillRect(l, t, w, h);
  x.strokeStyle = 'rgba(190,210,255,0.08)'; x.lineWidth = 1;
  for (let i = 0; i < w * 0.35; i++) {
    const rx = l + R() * w, ry = t + R() * h, len = 6 + R() * 16;
    x.beginPath(); x.moveTo(rx, ry); x.lineTo(rx - len * 0.12, ry + len); x.stroke();
  }
  x.restore();

  // the brass frame and Art Deco mullions
  const brass = x.createLinearGradient(l, t, l + w, t + h);
  brass.addColorStop(0, '#5a3d17'); brass.addColorStop(0.35, '#d9ad62'); brass.addColorStop(0.55, '#7a5422'); brass.addColorStop(1, '#c79a4f');
  x.strokeStyle = brass;
  x.lineWidth = Math.max(3, w * 0.022);
  archPath(x, l, t, w, h); x.stroke();
  x.lineWidth = Math.max(1.4, w * 0.008);
  const r = w / 2, cx = l + r, cy = t + r;
  x.beginPath(); x.moveTo(cx, cy); x.lineTo(cx, t + h); x.stroke();
  for (const f of [0.55, 0.78]) { x.beginPath(); x.moveTo(l, t + h * f); x.lineTo(l + w, t + h * f); x.stroke(); }
  x.beginPath(); x.moveTo(l, cy); x.lineTo(l + w, cy); x.stroke();
  // sunburst in the arch
  for (let i = 1; i < 8; i++) {
    const a = Math.PI + (Math.PI / 8) * i;
    x.beginPath(); x.moveTo(cx + Math.cos(a) * r * 0.22, cy + Math.sin(a) * r * 0.22); x.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); x.stroke();
  }
  x.beginPath(); x.arc(cx, cy, r * 0.22, Math.PI, 0); x.stroke();
  // the window's cool light on the wall around it
  blob(x, cx, t + h * 0.55, w * 1.1, 'rgba(110,140,255,0.06)');
}

function skyline(x, l, t, w, h, R) {
  const base = t + h;
  for (let layer = 0; layer < 3; layer++) {
    const shade = [26, 18, 11][layer];
    x.fillStyle = `rgb(${shade},${shade - 4},${shade + 18})`;
    let bx = l - 10;
    while (bx < l + w + 10) {
      const bw = 14 + R() * 30, bh = h * (0.18 + R() * (0.5 - layer * 0.1)) * (layer === 0 ? 0.8 : 1);
      x.fillRect(bx, base - bh, bw, bh);
      if (layer > 0) {
        for (let wy = base - bh + 5; wy < base - 4; wy += 6) for (let wx = bx + 3; wx < bx + bw - 3; wx += 5) {
          if (R() < 0.28) { x.fillStyle = R() < 0.8 ? 'rgba(255,200,120,0.55)' : 'rgba(120,220,255,0.6)'; x.fillRect(wx, wy, 2, 2.5); x.fillStyle = `rgb(${shade},${shade - 4},${shade + 18})`; }
        }
      }
      bx += bw + 2 + R() * 6;
    }
  }
  blob(x, l + w * 0.5, base, w * 0.8, 'rgba(255,90,200,0.18)');
}

function drawPanels(x, W, wallBottom, wins, winTop, winBot, R) {
  const pw = Math.max(86, Math.min(150, W / 9));
  const n = Math.ceil(W / pw) + 1;
  const off = (W - n * pw) / 2;
  for (let i = 0; i < n; i++) {
    const l = off + i * pw;
    // skip the parts behind the windows
    const hit = wins.some(w => l + pw > w.cx - w.w / 2 - 6 && l < w.cx + w.w / 2 + 6);
    const top = hit ? winBot + 14 : 0;
    // panel body
    let g = x.createLinearGradient(l, 0, l + pw, 0);
    g.addColorStop(0, '#120806'); g.addColorStop(0.5, '#1f0f09'); g.addColorStop(1, '#110705');
    x.fillStyle = g; x.fillRect(l, top, pw, wallBottom - top);
    // grain
    x.lineWidth = 1;
    for (let k = 0; k < 9; k++) {
      x.strokeStyle = `rgba(${R() < 0.5 ? '80,40,20' : '30,12,6'},${0.18 + R() * 0.2})`;
      const gx = l + R() * pw;
      x.beginPath(); x.moveTo(gx, top);
      for (let y = top; y < wallBottom; y += 24) x.lineTo(gx + Math.sin(y * 0.02 + k) * (1.5 + R() * 2.5), y);
      x.stroke();
    }
    // raised inner panel with a bevel
    const m = pw * 0.14;
    const iy = top + (hit ? 10 : 26), ih = wallBottom - iy - 24;
    if (ih > 30) {
      x.fillStyle = 'rgba(0,0,0,0.18)'; x.fillRect(l + m, iy, pw - 2 * m, ih);
      x.strokeStyle = 'rgba(255,190,120,0.07)'; x.beginPath(); x.moveTo(l + m, iy + ih); x.lineTo(l + m, iy); x.lineTo(l + pw - m, iy); x.stroke();
      x.strokeStyle = 'rgba(0,0,0,0.45)'; x.beginPath(); x.moveTo(l + pw - m, iy); x.lineTo(l + pw - m, iy + ih); x.lineTo(l + m, iy + ih); x.stroke();
    }
    // seam
    x.fillStyle = 'rgba(0,0,0,0.5)'; x.fillRect(l, top, 1.5, wallBottom - top);
  }
  // brass rails: crown and chair rail
  for (const [y, hgt] of [[2, 3], [wallBottom - 6, 4]]) {
    const g = x.createLinearGradient(0, y, 0, y + hgt);
    g.addColorStop(0, '#e2b56b'); g.addColorStop(0.5, '#8a6026'); g.addColorStop(1, '#3a250c');
    x.fillStyle = g; x.fillRect(0, y, W, hgt);
  }
  // window sills
  for (const w of wins) {
    const g = x.createLinearGradient(0, winBot, 0, winBot + 10);
    g.addColorStop(0, '#d8aa5f'); g.addColorStop(1, '#3a250c');
    x.fillStyle = g; x.fillRect(w.cx - w.w / 2 - 10, winBot, w.w + 20, 8);
  }
}

function drawBackBar(x, W, H, wallBottom, wide, R) {
  const shelves = wide ? [wallBottom + H * 0.02, wallBottom + H * 0.085] : [wallBottom + H * 0.03, wallBottom + H * 0.09];
  // the mirrored back wall behind the bottles
  let g = x.createLinearGradient(0, wallBottom, 0, H * 0.88);
  g.addColorStop(0, '#1a0e0a'); g.addColorStop(1, '#0a0507');
  x.fillStyle = g; x.fillRect(0, wallBottom - 2, W, H * 0.88 - wallBottom);
  for (const sy of shelves) {
    // the LED strip's warm wash up the bottles
    g = x.createLinearGradient(0, sy - 46, 0, sy + 2);
    g.addColorStop(0, 'rgba(255,170,80,0)'); g.addColorStop(1, 'rgba(255,170,80,0.22)');
    x.fillStyle = g; x.fillRect(0, sy - 46, W, 48);
    // bottles
    let bx = R() * 10;
    while (bx < W) {
      const bw = 9 + R() * 9, bh = 22 + R() * 22, neck = bh * (0.28 + R() * 0.15);
      const tint = R();
      const glass = tint < 0.18 ? 'rgba(60,140,110,0.55)' : tint < 0.34 ? 'rgba(150,70,40,0.6)' : tint < 0.45 ? 'rgba(120,120,150,0.4)' : 'rgba(40,22,18,0.75)';
      x.fillStyle = glass;
      x.beginPath();
      x.moveTo(bx, sy); x.lineTo(bx, sy - bh + neck);
      x.quadraticCurveTo(bx, sy - bh + neck * 0.6, bx + bw * 0.35, sy - bh + neck * 0.45);
      x.lineTo(bx + bw * 0.35, sy - bh); x.lineTo(bx + bw * 0.65, sy - bh); x.lineTo(bx + bw * 0.65, sy - bh + neck * 0.45);
      x.quadraticCurveTo(bx + bw, sy - bh + neck * 0.6, bx + bw, sy - bh + neck);
      x.lineTo(bx + bw, sy); x.closePath(); x.fill();
      // rim light: amber from below, a neon kiss now and then
      const kiss = R();
      x.strokeStyle = kiss < 0.12 ? 'rgba(120,220,255,0.55)' : kiss < 0.22 ? 'rgba(255,110,200,0.5)' : 'rgba(255,200,130,0.32)';
      x.lineWidth = 1;
      x.beginPath(); x.moveTo(bx + 1.2, sy - 2); x.lineTo(bx + 1.2, sy - bh + neck); x.stroke();
      if (R() < 0.5) { x.fillStyle = 'rgba(240,225,190,0.16)'; x.fillRect(bx + 1.5, sy - bh * 0.48, bw - 3, bh * 0.2); }
      bx += bw + 3 + R() * 9;
    }
    // the glass shelf
    g = x.createLinearGradient(0, sy, 0, sy + 4);
    g.addColorStop(0, 'rgba(255,220,170,0.6)'); g.addColorStop(1, 'rgba(255,160,80,0.05)');
    x.fillStyle = g; x.fillRect(0, sy, W, 4);
  }
}

function drawPendant(x, cx, y, s, H) {
  // the warm cone of light
  const coneH = H * 0.75;
  let g = x.createLinearGradient(0, y, 0, y + coneH);
  g.addColorStop(0, 'rgba(255,200,130,0.10)'); g.addColorStop(1, 'rgba(255,200,130,0)');
  x.fillStyle = g;
  x.beginPath(); x.moveTo(cx - 12 * s, y + 10 * s); x.lineTo(cx + 12 * s, y + 10 * s); x.lineTo(cx + coneH * 0.42, y + coneH); x.lineTo(cx - coneH * 0.42, y + coneH); x.closePath(); x.fill();
  blob(x, cx, y + 14 * s, 150 * s, 'rgba(255,190,110,0.16)');
  // cord
  x.strokeStyle = 'rgba(30,20,14,0.9)'; x.lineWidth = 1.5;
  x.beginPath(); x.moveTo(cx, 0); x.lineTo(cx, y - 8 * s); x.stroke();
  // shade
  g = x.createLinearGradient(cx - 16 * s, 0, cx + 16 * s, 0);
  g.addColorStop(0, '#4a3112'); g.addColorStop(0.4, '#e6bb72'); g.addColorStop(0.7, '#8c6228'); g.addColorStop(1, '#3a250c');
  x.fillStyle = g;
  x.beginPath(); x.moveTo(cx - 5 * s, y - 9 * s); x.lineTo(cx + 5 * s, y - 9 * s); x.lineTo(cx + 17 * s, y + 9 * s); x.lineTo(cx - 17 * s, y + 9 * s); x.closePath(); x.fill();
  // the bulb's glow under the shade
  blob(x, cx, y + 10 * s, 26 * s, 'rgba(255,236,190,0.75)');
  x.fillStyle = '#fff3d6'; x.beginPath(); x.ellipse(cx, y + 9.5 * s, 9 * s, 2.2 * s, 0, 0, TAU); x.fill();
}

function drawCounter(x, W, H) {
  const top = H * 0.885;
  let g = x.createLinearGradient(0, top, 0, H);
  g.addColorStop(0, '#2a140b'); g.addColorStop(0.08, '#0f0705'); g.addColorStop(1, '#050203');
  x.fillStyle = g; x.fillRect(0, top, W, H - top);
  // the polished edge catching the lamps
  g = x.createLinearGradient(0, 0, W, 0);
  g.addColorStop(0, 'rgba(255,200,140,0.05)'); g.addColorStop(0.3, 'rgba(255,210,150,0.45)'); g.addColorStop(0.5, 'rgba(255,230,190,0.6)'); g.addColorStop(0.7, 'rgba(255,210,150,0.45)'); g.addColorStop(1, 'rgba(255,200,140,0.05)');
  x.fillStyle = g; x.fillRect(0, top, W, 1.5);
  // a brass foot rail
  g = x.createLinearGradient(0, H - 18, 0, H - 12);
  g.addColorStop(0, '#d9ad62'); g.addColorStop(1, '#3a250c');
  x.fillStyle = g; x.fillRect(0, H - 18, W, 5);
}
