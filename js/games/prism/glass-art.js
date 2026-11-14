// PRISM DROP — THE GLASS DRAWINGS (the first look: "glass crystal" blocks — RETIRED as the day look by PD-4, kept as a skin of its own that
// nothing picks; moved out of board.js by SKINS 1, not a pixel changed). Gradient body, inner glow, a facet, a specular glint, clean bright
// edges — plus a soft glow sprite drawn under them and a desaturated set for the danger drain.
//   glassSprite(size, kind, t) · clearGlass() · glassCount()
import { rr, rgba, mix, mixA, grey, JEWEL, INCOMING } from './skin-kit.js';

const sprites = new Map(); // `${size}|${kind}|${t}` -> canvas

function blockSprite(size, color, junk = false) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const x = c.getContext('2d');
  const p = Math.max(1, size * 0.045);
  const s = size - 2 * p;
  const r = size * 0.16;
  // body
  const g = x.createLinearGradient(p, p, p + s, p + s);
  g.addColorStop(0, mix(color, '#ffffff', junk ? 0.12 : 0.32));
  g.addColorStop(0.45, color);
  g.addColorStop(1, mix(color, '#000000', junk ? 0.45 : 0.38));
  rr(x, p, p, s, s, r);
  x.fillStyle = g;
  x.fill();
  x.save();
  rr(x, p, p, s, s, r);
  x.clip();
  // inner glow (light from inside the crystal)
  const ig = x.createRadialGradient(p + s * 0.5, p + s * 0.55, s * 0.05, p + s * 0.5, p + s * 0.5, s * 0.7);
  ig.addColorStop(0, junk ? 'rgba(255,255,255,0)' : mixA(color, '#ffffff', 0.55, 0.45));
  ig.addColorStop(1, rgba(color, 0));
  x.fillStyle = ig;
  x.fillRect(0, 0, size, size);
  // facet: a lighter upper-left plane cut diagonally
  x.beginPath();
  x.moveTo(p, p);
  x.lineTo(p + s * 0.78, p);
  x.lineTo(p + s * 0.22, p + s * 0.78);
  x.lineTo(p, p + s * 0.62);
  x.closePath();
  x.fillStyle = `rgba(255,255,255,${junk ? 0.05 : 0.13})`;
  x.fill();
  // lower facet: darker
  x.beginPath();
  x.moveTo(p + s, p + s * 0.35);
  x.lineTo(p + s, p + s);
  x.lineTo(p + s * 0.35, p + s);
  x.closePath();
  x.fillStyle = 'rgba(0,0,0,0.16)';
  x.fill();
  // specular glint
  const sg = x.createRadialGradient(p + s * 0.28, p + s * 0.24, 0, p + s * 0.28, p + s * 0.24, s * 0.3);
  sg.addColorStop(0, `rgba(255,255,255,${junk ? 0.18 : 0.6})`);
  sg.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = sg;
  x.fillRect(0, 0, size, size);
  x.restore();
  // edges: bright top-left rim, darker bottom-right rim
  rr(x, p + 0.5, p + 0.5, s - 1, s - 1, r);
  x.lineWidth = Math.max(1, size * 0.05);
  const eg = x.createLinearGradient(p, p, p + s, p + s);
  eg.addColorStop(0, `rgba(255,255,255,${junk ? 0.25 : 0.75})`);
  eg.addColorStop(0.5, rgba(color, 0.9));
  eg.addColorStop(1, 'rgba(0,0,0,0.35)');
  x.strokeStyle = eg;
  x.stroke();
  return c;
}

function glowSprite(size, color) {
  const c = document.createElement('canvas');
  const n = Math.round(size * 2.2);
  c.width = c.height = n;
  const x = c.getContext('2d');
  const g = x.createRadialGradient(n / 2, n / 2, size * 0.2, n / 2, n / 2, n / 2);
  g.addColorStop(0, rgba(color, 0.55));
  g.addColorStop(0.5, rgba(color, 0.16));
  g.addColorStop(1, rgba(color, 0));
  x.fillStyle = g;
  x.fillRect(0, 0, n, n);
  return c;
}

function ghostSprite(size, color) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const x = c.getContext('2d');
  const p = Math.max(1, size * 0.08);
  rr(x, p, p, size - 2 * p, size - 2 * p, size * 0.16);
  x.fillStyle = rgba(color, 0.13);
  x.fill();
  x.lineWidth = Math.max(1, size * 0.06);
  x.strokeStyle = rgba(color, 0.62);
  x.stroke();
  return c;
}

// (PD-2) an INCOMING ghost cell: see-through warning red, a bright rim, a lit top edge — a ghost, never a solid block
function incomingSprite(size) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const x = c.getContext('2d');
  const p = Math.max(1, size * 0.07);
  const s = size - 2 * p;
  rr(x, p, p, s, s, size * 0.14);
  x.fillStyle = rgba(INCOMING, 0.26);
  x.fill();
  // diagonal hatching: a ghost, never mistaken for a glass block (a ruby block is solid + glossy)
  x.save();
  rr(x, p, p, s, s, size * 0.14);
  x.clip();
  x.strokeStyle = 'rgba(255,150,172,0.62)';
  x.lineWidth = Math.max(1, size * 0.07);
  for (let k = -1; k <= 2; k++) { const o = p + k * s * 0.42; x.beginPath(); x.moveTo(o, p + s); x.lineTo(o + s, p); x.stroke(); }
  x.restore();
  x.lineWidth = Math.max(1, size * 0.06);
  x.strokeStyle = 'rgba(255,186,200,0.95)';
  x.stroke();
  return c;
}
export function glassSprite(size, kind, t) {
  const key = `${size}|${kind}|${t}`;
  let s = sprites.get(key);
  if (!s) {
    const col = JEWEL[t] || JEWEL[8];
    s = kind === 'block' ? blockSprite(size, col, t === 8)
      : kind === 'grey' ? blockSprite(size, grey(col), true)
        : kind === 'glow' ? glowSprite(size, col)
          : kind === 'incoming' ? incomingSprite(size)
            : kind === 'iglow' ? glowSprite(size, INCOMING)
            : ghostSprite(size, col);
    sprites.set(key, s);
  }
  return s;
}

export const clearGlass = () => { for (const c of sprites.values()) if (c && typeof c.width === 'number') { c.width = 0; c.height = 0; } sprites.clear(); };
export const glassCount = () => sprites.size;
