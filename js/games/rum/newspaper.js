// RUMRUNNER — the morning paper: a 1920s art-deco front page drawn on a canvas (so the very same page is what gets saved as
// an image). Aged paper, THE NEON GAZETTE masthead with a neon-gold glow, a halftone hero "photograph" of the city, the
// winner's headline, a column per player, BY THE NUMBERS. Everything comes from text.js#headlines (what actually happened).
import { rngFrom } from '../../core/rng.js';

export const PAGE = { w: 1200, h: 1680 };
const SERIF = "'Playfair Display', Georgia, 'Times New Roman', serif";
const BODY = "Georgia, 'Times New Roman', serif";
const GOLD = '#8a6a1c', INK = '#1d1812', FAINT = '#5a4e3c';

export async function loadPaperFonts() {
  try { await Promise.all(['900 60px "Playfair Display"', '700 30px "Playfair Display"', 'italic 600 24px "Playfair Display"'].map(f => document.fonts.load(f))); } catch { /* the serif fallback is fine */ }
}

/** Draws the page. paper: headlines(); opts: { names, colors, seed, days, winnerUid, dpr }. Returns the canvas. */
export function drawNewspaper(paper, { names = {}, seed = 'paper', days = 20, dpr = 1 } = {}) {
  const r = rngFrom(`${seed}:paper`);
  const c = document.createElement('canvas');
  c.width = PAGE.w * dpr; c.height = PAGE.h * dpr;
  const g = c.getContext('2d');
  g.scale(dpr, dpr);
  const W = PAGE.w, H = PAGE.h, M = 56;

  // ---- the paper: cream, a warm vignette, grain, a few foxing stains, a fold
  const bg = g.createLinearGradient(0, 0, W, H); bg.addColorStop(0, '#efe3c6'); bg.addColorStop(0.5, '#e9dcbb'); bg.addColorStop(1, '#dccba3');
  g.fillStyle = bg; g.fillRect(0, 0, W, H);
  const vg = g.createRadialGradient(W / 2, H / 2, H * 0.25, W / 2, H / 2, H * 0.78); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(80,50,10,0.22)');
  g.fillStyle = vg; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 2600; i++) { g.fillStyle = `rgba(90,60,20,${0.02 + r() * 0.05})`; g.fillRect(r() * W, r() * H, 1 + r() * 2, 1 + r() * 2); }
  for (let i = 0; i < 7; i++) { const x = r() * W, y = r() * H, rad = 20 + r() * 70; const s = g.createRadialGradient(x, y, 0, x, y, rad); s.addColorStop(0, 'rgba(150,100,30,0.10)'); s.addColorStop(1, 'rgba(150,100,30,0)'); g.fillStyle = s; g.fillRect(x - rad, y - rad, rad * 2, rad * 2); }
  g.fillStyle = 'rgba(60,40,10,0.06)'; g.fillRect(0, H * 0.5 - 1, W, 2);

  const rule = (y, w = 2, x0 = M, x1 = W - M) => { g.fillStyle = INK; g.fillRect(x0, y, x1 - x0, w); };
  const goldRule = (y, w = 2, x0 = M, x1 = W - M) => { g.fillStyle = GOLD; g.fillRect(x0, y, x1 - x0, w); };
  const text = (s, x, y, { font, color = INK, align = 'left', ls = 0, max = null } = {}) => {
    g.font = font; g.fillStyle = color; g.textAlign = align; g.textBaseline = 'alphabetic';
    if (ls) { try { g.letterSpacing = `${ls}px`; } catch { /* old browsers */ } }
    if (max) { let t = s; while (t.length > 3 && g.measureText(t).width > max) t = t.slice(0, -2); if (t !== s) t = t.slice(0, -1) + '…'; s = t; }
    g.fillText(s, x, y);
    if (ls) { try { g.letterSpacing = '0px'; } catch { /* fine */ } }
  };
  const wrap = (s, font, max) => {
    g.font = font;
    const words = String(s).split(/\s+/), lines = []; let line = '';
    for (const w of words) { const t = line ? `${line} ${w}` : w; if (g.measureText(t).width > max && line) { lines.push(line); line = w; } else line = t; }
    if (line) lines.push(line);
    return lines;
  };
  const para = (s, x, y, max, font, lh, color = INK, align = 'left', maxLines = 99) => {
    const lines = wrap(s, font, max).slice(0, maxLines);
    lines.forEach((l, i) => text(l, align === 'center' ? x + max / 2 : x, y + i * lh, { font, color, align }));
    return y + lines.length * lh;
  };

  // ---- masthead
  let y = M + 10;
  rule(y, 1.5); y += 22;
  text((paper.dateline || `MORNING EDITION · DAY ${days} · FIVE CENTS`).toUpperCase(), W / 2, y + 6, { font: `600 17px ${BODY}`, color: FAINT, align: 'center', ls: 3 });
  y += 24; rule(y, 1); y += 18;
  const mast = paper.masthead || 'THE NEON GAZETTE';
  g.save();
  g.shadowColor = 'rgba(240,199,94,0.9)'; g.shadowBlur = 26;
  text(mast, W / 2, y + 84, { font: `900 96px ${SERIF}`, color: '#2a1e10', align: 'center', ls: 6 });
  g.shadowBlur = 0;
  text(mast, W / 2, y + 84, { font: `900 96px ${SERIF}`, color: INK, align: 'center', ls: 6 });
  g.restore();
  y += 108;
  // deco ornaments either side of the motto
  goldRule(y, 3); rule(y + 7, 1); y += 24;
  const motto = 'ALL THE NEWS THAT’S FIT TO POUR  ·  NEON SPEAKEASY';
  text(motto, W / 2, y + 10, { font: `italic 600 18px ${SERIF}`, color: FAINT, align: 'center', ls: 1.5 });
  y += 24; rule(y, 1); goldRule(y + 5, 3); y += 34;

  // ---- the lead story (left 2/3) and the hero photo (right 1/3)
  const colGap = 28;
  const heroW = Math.round((W - 2 * M - colGap) * 0.38), leadW = W - 2 * M - colGap - heroW;
  const leadX = M, heroX = W - M - heroW;
  const main = paper.main || { head: 'THE NIGHT IS OVER', deck: '' };
  let hy = y;
  const headLines = wrap(main.head.toUpperCase(), `900 62px ${SERIF}`, leadW);
  headLines.slice(0, 3).forEach((l, i) => text(l, leadX, hy + 56 + i * 66, { font: `900 62px ${SERIF}`, color: INK }));
  hy += 56 + Math.min(3, headLines.length) * 66 + 6;
  goldRule(hy, 2, leadX, leadX + leadW); hy += 30;
  hy = para(main.deck || '', leadX, hy, leadW, `italic 600 26px ${SERIF}`, 36, '#2a2218', 'left', 4) + 10;
  // the hero: a halftone night skyline with a truck, framed in gold
  const heroH = Math.max(300, hy - y);
  drawHero(g, heroX, y, heroW, heroH, r);
  g.strokeStyle = GOLD; g.lineWidth = 3; g.strokeRect(heroX - 4, y - 4, heroW + 8, heroH + 8);
  g.strokeStyle = INK; g.lineWidth = 1; g.strokeRect(heroX - 9, y - 9, heroW + 18, heroH + 18);
  text((paper.caption || `The city at dawn, after ${days} days of it.`).toUpperCase(), heroX + heroW / 2, y + heroH + 30, { font: `600 14px ${BODY}`, color: FAINT, align: 'center', ls: 2, max: heroW });
  y = Math.max(hy, y + heroH + 44) + 10;
  rule(y, 1); y += 26;

  // ---- the columns: one story per player, flowing across three columns; BY THE NUMBERS in the last column's top
  const cols = 3, colW = (W - 2 * M - colGap * (cols - 1)) / cols;
  const colX = i => M + i * (colW + colGap);
  const bottom = H - M - 60;
  // the stats box first (top of the last column)
  let statsBottom = y;
  if (paper.stats && paper.stats.length) {
    const x = colX(cols - 1), boxTop = y;
    let sy = y + 36;
    text('BY THE NUMBERS', x + colW / 2, sy, { font: `800 20px ${SERIF}`, align: 'center', ls: 2 });
    sy += 14; goldRule(sy, 2, x + 10, x + colW - 10); sy += 28;
    for (const s of paper.stats.slice(0, 6)) {
      text(String(s.label || '').toUpperCase(), x + 12, sy, { font: `700 13px ${BODY}`, color: FAINT, ls: 1.5 });
      sy += 22;
      const who = s.uid && names[s.uid] ? `${names[s.uid]} · ` : '';
      sy = para(`${who}${s.value}`, x + 12, sy, colW - 24, `700 19px ${SERIF}`, 24, INK, 'left', 3) + 12;
    }
    g.strokeStyle = GOLD; g.lineWidth = 2; g.strokeRect(x, boxTop, colW, sy - boxTop + 4);
    g.strokeStyle = INK; g.lineWidth = 0.8; g.strokeRect(x + 5, boxTop + 5, colW - 10, sy - boxTop - 6);
    statsBottom = sy + 30;
  }
  const colTop = i => (i === cols - 1 ? statsBottom : y);
  let ci = 0, cy = colTop(0);
  const items = (paper.items || []).slice(0, 8);
  // the stories spread over the first two columns (the third opens under BY THE NUMBERS)
  const half = colTop(0) + (bottom - colTop(0)) * 0.5;
  items.forEach((it, idx) => {
    const head = wrap(String(it.head || '').toUpperCase(), `800 24px ${SERIF}`, colW);
    const body = wrap(it.body || '', `400 17px ${BODY}`, colW);
    const need = head.length * 28 + 12 + body.length * 23 + 30;
    if (ci === 0 && idx > 0 && cy > half && items.length - idx >= 1) { ci = 1; cy = colTop(1); }
    if (cy + need > bottom && ci < cols - 1) { ci++; cy = colTop(ci); }
    if (cy + need > bottom) return;
    head.forEach((l, i) => text(l, colX(ci), cy + 22 + i * 28, { font: `800 24px ${SERIF}` }));
    cy += head.length * 28 + 8;
    goldRule(cy, 1.5, colX(ci), colX(ci) + 60); cy += 22;
    body.forEach((l, i) => text(l, colX(ci), cy + i * 23, { font: `400 17px ${BODY}`, color: '#2a2218' }));
    cy += body.length * 23 + 30;
  });
  // ---- the foot
  rule(H - M - 40, 1); goldRule(H - M - 35, 2);
  text('NEON SPEAKEASY  ·  NEONSPEAKEASY.COM  ·  RUMRUNNER', W / 2, H - M - 8, { font: `600 14px ${BODY}`, color: FAINT, align: 'center', ls: 3 });
  return c;
}

/** A halftone "photograph": the night skyline, neon, a truck with its headlights — drawn soft, then screened into dots. */
function drawHero(g, x, y, w, h, r) {
  const s = document.createElement('canvas'); s.width = Math.ceil(w / 2); s.height = Math.ceil(h / 2);
  const q = s.getContext('2d'); const sw = s.width, sh = s.height;
  const sky = q.createLinearGradient(0, 0, 0, sh); sky.addColorStop(0, '#5a4a7a'); sky.addColorStop(0.6, '#2a2240'); sky.addColorStop(1, '#e2a26a');
  q.fillStyle = sky; q.fillRect(0, 0, sw, sh);
  // buildings
  let bx = 0;
  while (bx < sw) { const bw = 10 + r() * 22, bh = sh * (0.25 + r() * 0.5); q.fillStyle = `rgb(${20 + r() * 20},${16 + r() * 16},${30 + r() * 20})`; q.fillRect(bx, sh - bh - sh * 0.16, bw, bh); for (let wy = sh - bh - sh * 0.14; wy < sh - sh * 0.18; wy += 6) for (let wx = bx + 2; wx < bx + bw - 3; wx += 5) if (r() < 0.45) { q.fillStyle = r() < 0.7 ? '#ffe6a0' : '#ffb0c0'; q.fillRect(wx, wy, 2.5, 3); } bx += bw + 2 + r() * 4; }
  // a neon sign glow
  const nx = sw * 0.3, ny = sh * 0.42; const ng = q.createRadialGradient(nx, ny, 0, nx, ny, sw * 0.3); ng.addColorStop(0, 'rgba(255,90,150,0.7)'); ng.addColorStop(1, 'rgba(255,90,150,0)'); q.fillStyle = ng; q.fillRect(0, 0, sw, sh);
  // wet street + truck
  const st = q.createLinearGradient(0, sh * 0.82, 0, sh); st.addColorStop(0, '#1a1724'); st.addColorStop(1, '#3a2e40'); q.fillStyle = st; q.fillRect(0, sh * 0.82, sw, sh * 0.18);
  const tx = sw * 0.55, ty = sh * 0.74, tw = sw * 0.3, th = sh * 0.14;
  q.fillStyle = '#0d0b12'; q.fillRect(tx, ty, tw, th); q.fillRect(tx + tw * 0.62, ty - th * 0.45, tw * 0.3, th * 0.5);
  q.fillStyle = '#0a0a0e'; q.beginPath(); q.arc(tx + tw * 0.2, ty + th, th * 0.32, 0, 7); q.arc(tx + tw * 0.78, ty + th, th * 0.32, 0, 7); q.fill();
  const hl = q.createRadialGradient(tx + tw, ty + th * 0.6, 0, tx + tw, ty + th * 0.6, tw * 0.9); hl.addColorStop(0, 'rgba(255,240,200,0.95)'); hl.addColorStop(1, 'rgba(255,240,200,0)'); q.fillStyle = hl; q.fillRect(0, 0, sw, sh);
  // the screen: luminance → dot size on a 45° grid
  const img = q.getImageData(0, 0, sw, sh).data;
  g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
  g.fillStyle = '#f3e9cf'; g.fillRect(x, y, w, h);
  const cell = 5.2;
  g.fillStyle = '#1d1812';
  for (let gy = 0; gy < h + cell; gy += cell) {
    for (let gx = (Math.round(gy / cell) % 2) * cell / 2; gx < w + cell; gx += cell) {
      const px = Math.min(sw - 1, Math.floor(gx / 2)), py = Math.min(sh - 1, Math.floor(gy / 2));
      const i = (py * sw + px) * 4; const lum = (img[i] * 0.3 + img[i + 1] * 0.59 + img[i + 2] * 0.11) / 255;
      const rad = (1 - lum) * cell * 0.62;
      if (rad > 0.25) { g.beginPath(); g.arc(x + gx, y + gy, rad, 0, 7); g.fill(); }
    }
  }
  g.restore();
}

/** Saves the page: the share sheet on phones that have it, else a download. */
export async function savePage(canvas, filename = 'neon-gazette.png') {
  const blob = await new Promise(res => canvas.toBlob(res, 'image/png'));
  if (!blob) return false;
  try {
    const file = new File([blob], filename, { type: 'image/png' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: 'THE NEON GAZETTE' }); return true; }
  } catch (e) { if (e && e.name === 'AbortError') return true; }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  return true;
}
