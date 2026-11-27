// FREEFALL F5A — THE BILLBOARD = A · THE LOGO (the owner's pick, Nov 26 — docs/freefall.md "THE BILLBOARD"; HIGH RISE's B1 formula,
// 848 : 448): title-05's lettering big on the LEFT over the NIGHT rooftop city (FREEFALL's own panorama), THE BURNING TOWER on the right
// fading into the city (a STAGED frame of the finished game — the ball ablaze over the rooftop's floors), a dark FOOT BAND (a quarter of
// the height) with a pink neon line along its top + OPEN NOW in big white heavy letters. PURE CANVAS: the painter is handed its pictures
// + the lettering's path data (Bowlby One's OPEN NOW — the very paths HIGH RISE's B1 reads: js/games/highrise/billboard-glyphs.js, handed
// in by the builder — no font load, no import across games). NOT part of any game's graph: only scripts/build-freefall-billboard.mjs
// reads it (→ assets/city/freefall/billboard.webp, the words baked in). NOT installed in the city: the CITY chat does that at go-live.

/** THE LAYOUT, as shares of the board (W × H): the foot band · the logo (its width, its left + top) · the part of the panorama behind it
 *  (its own pixels: the bridge + the city, the sky over them for the lettering) · the tower (where the ball stands, how wide the staged
 *  frame is drawn, how far its left side fades into the city) · OPEN NOW's cap height as a share of the band */
export const BOARD = Object.freeze({
  w: 848, h: 448, band: 0.25,
  logoW: 0.6, logoX: 0.028, logoY: 0.045,
  city: Object.freeze({ x: 980, y: 262, w: 1420, h: 750 }),
  towerBallX: 0.795, towerBallY: 0.33, towerW: 0.47, towerFade: 0.42,
  openCap: 0.56, openMaxW: 0.86,
});
const PINK = '#ff4fa8';

/**
 * paintBoard(c, W, H, { city, tower, ball: { x, y } (the ball's place in `tower`, 0 … 1), logo, open: { w, cap, d } }) — the whole board
 * into a 2D context. → { band: the band's top (px), logo: { x, y, w, h }, open: { cap, base, w } } (the readability proof's numbers)
 */
export function paintBoard(c, W, H, pics) {
  const B = BOARD, bandY = Math.round(H * (1 - B.band)), k = W / B.w;
  // THE CITY: FREEFALL's own night panorama, covering the board
  c.drawImage(pics.city, B.city.x, B.city.y, B.city.w, B.city.h, 0, 0, W, H);
  c.fillStyle = 'rgba(8,5,24,0.2)'; c.fillRect(0, 0, W, H);
  // THE BURNING TOWER on the right: the staged frame, its left side + its foot fading into the city
  const tw = W * B.towerW, th = tw * pics.tower.height / pics.tower.width, tx = W * B.towerBallX - tw * pics.ball.x, ty = bandY * B.towerBallY - th * pics.ball.y;
  const off = document.createElement('canvas'); off.width = Math.ceil(tw); off.height = Math.ceil(th);
  const o = off.getContext('2d');
  o.imageSmoothingQuality = 'high'; o.drawImage(pics.tower, 0, 0, off.width, off.height);
  o.globalCompositeOperation = 'destination-in';
  let g = o.createLinearGradient(0, 0, off.width, 0);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(B.towerFade, 'rgba(0,0,0,1)'); g.addColorStop(0.9, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0.6)');
  o.fillStyle = g; o.fillRect(0, 0, off.width, off.height);
  c.drawImage(off, tx, ty);
  // (the words read on any city: a soft dark behind the lettering)
  const lw = W * B.logoW, lh = lw * pics.logo.height / pics.logo.width, lx = W * B.logoX, ly = H * B.logoY;
  g = c.createRadialGradient(lx + lw * 0.5, ly + lh * 0.52, lh * 0.2, lx + lw * 0.5, ly + lh * 0.52, lw * 0.62);
  g.addColorStop(0, 'rgba(6,4,20,0.62)'); g.addColorStop(1, 'rgba(6,4,20,0)');
  c.fillStyle = g; c.fillRect(0, 0, W, bandY);
  // THE LOGO: title-05's lettering, big on the left
  c.save(); c.shadowColor = 'rgba(0,0,0,0.7)'; c.shadowBlur = 18 * k; c.shadowOffsetY = 4 * k; c.imageSmoothingQuality = 'high'; c.drawImage(pics.logo, lx, ly, lw, lh); c.restore();
  // THE FOOT BAND: dark, a pink neon line along its top
  g = c.createLinearGradient(0, bandY - 26 * k, 0, bandY); g.addColorStop(0, 'rgba(7,5,14,0)'); g.addColorStop(1, 'rgba(7,5,14,0.9)');
  c.fillStyle = g; c.fillRect(0, bandY - 26 * k, W, 26 * k);
  c.fillStyle = '#07050e'; c.fillRect(0, bandY, W, H - bandY);
  c.save(); c.strokeStyle = PINK; c.lineWidth = 4 * k; c.shadowColor = PINK; c.shadowBlur = 16 * k; c.beginPath(); c.moveTo(0, bandY); c.lineTo(W, bandY); c.stroke(); c.stroke();
  c.shadowBlur = 0; c.strokeStyle = '#fff3fa'; c.lineWidth = 1.4 * k; c.beginPath(); c.moveTo(0, bandY); c.lineTo(W, bandY); c.stroke(); c.restore();
  // OPEN NOW: big, WHITE, heavy — on the dark band (never black-on-pink)
  const G = pics.open, cap = Math.min((H - bandY) * B.openCap, (W * B.openMaxW) / (G.w / G.cap)), s = cap / G.cap, ow = G.w * s, base = bandY + (H - bandY + cap) / 2;
  c.save(); c.translate((W - ow) / 2, base); c.scale(s, s);
  const p = new Path2D(G.d);
  c.shadowColor = PINK; c.shadowBlur = cap * 0.3; c.fillStyle = '#ffffff'; c.fill(p); c.shadowBlur = 0; c.fill(p);
  c.restore();
  return { band: bandY, logo: { x: lx, y: ly, w: lw, h: lh }, open: { cap, base, w: ow } };
}
