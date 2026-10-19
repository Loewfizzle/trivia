// THE CITY'S SIGNS — a rooftop marquee, a blade sign, neon icon signs and an LED ticker, built in the main sign's language
// (glass tubes with a white-hot core, layered glow, electrode caps, mounting clips, brackets). They replace the old
// billboards. Each sign is drawn once into offscreen canvases (the unlit sign: housing, brackets, glass; the lit tubes,
// one canvas per tube so they can buzz on one by one); a frame only blends those, plus the marquee's bulbs and the
// ticker's scroll. Signs rotate through the games (sign-logic.js: one change at a time, every game within a minute),
// switch off by day and buzz back on at dusk, dress for the holidays, and are tappable (→ that game's HOW TO PLAY).
import { markFor, bladeWord, LETTERS, tubeEnds, mixHex, hexRgb } from './marks.js';
import { createRotation, rotate, tickerText } from './sign-logic.js';

const TAU = Math.PI * 2;
const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; };
const rgba = (hex, a) => { const [r, g, b] = hexRgb(hex); return `rgba(${r},${g},${b},${a})`; };
const hit = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
const NEAR_ALPHA = [0.55, 0.62, 0.84, 1];   // far signs sit back in the haze

// the 5×7 dot font of the ticker
const FONT = {};
(() => {
  const raw = {
    A: '01110,10001,10001,11111,10001,10001,10001', B: '11110,10001,10001,11110,10001,10001,11110', C: '01110,10001,10000,10000,10000,10001,01110',
    D: '11110,10001,10001,10001,10001,10001,11110', E: '11111,10000,10000,11110,10000,10000,11111', F: '11111,10000,10000,11110,10000,10000,10000',
    G: '01110,10001,10000,10111,10001,10001,01111', H: '10001,10001,10001,11111,10001,10001,10001', I: '01110,00100,00100,00100,00100,00100,01110',
    J: '00111,00010,00010,00010,00010,10010,01100', K: '10001,10010,10100,11000,10100,10010,10001', L: '10000,10000,10000,10000,10000,10000,11111',
    M: '10001,11011,10101,10101,10001,10001,10001', N: '10001,10001,11001,10101,10011,10001,10001', O: '01110,10001,10001,10001,10001,10001,01110',
    P: '11110,10001,10001,11110,10000,10000,10000', Q: '01110,10001,10001,10001,10101,10010,01101', R: '11110,10001,10001,11110,10100,10010,10001',
    S: '01111,10000,10000,01110,00001,00001,11110', T: '11111,00100,00100,00100,00100,00100,00100', U: '10001,10001,10001,10001,10001,10001,01110',
    V: '10001,10001,10001,10001,10001,01010,00100', W: '10001,10001,10001,10101,10101,10101,01010', X: '10001,10001,01010,00100,01010,10001,10001',
    Y: '10001,10001,01010,00100,00100,00100,00100', Z: '11111,00001,00010,00100,01000,10000,11111',
    0: '01110,10001,10011,10101,11001,10001,01110', 1: '00100,01100,00100,00100,00100,00100,01110', 2: '01110,10001,00001,00010,00100,01000,11111',
    3: '11111,00010,00100,00010,00001,10001,01110', 4: '00010,00110,01010,10010,11111,00010,00010', 5: '11111,10000,11110,00001,00001,10001,01110',
    6: '00110,01000,10000,11110,10001,10001,01110', 7: '11111,00001,00010,00100,01000,01000,01000', 8: '01110,10001,10001,01110,10001,10001,01110',
    9: '01110,10001,10001,01111,00001,00010,01100', ':': '0,0,1,0,1,0,0', '·': '00,00,00,11,11,00,00', '-': '0000,0000,0000,1111,0000,0000,0000',
    '.': '00,00,00,00,00,11,11', "'": '11,11,01,10,00,00,00', '!': '1,1,1,1,1,0,1', '★': '00100,00100,11111,01110,01010,10001,00000', ' ': '000,000,000,000,000,000,000',
  };
  for (const [k, v] of Object.entries(raw)) FONT[k] = v.split(',');
})();

// holiday colours
const BULB = '#ffd9a0';
const PASTEL = ['#ffb3de', '#a8dcff', '#d2b8ff', '#ffe7a0'];
const RWB = ['#ff3048', '#f4f6ff', '#3d7bff'];
function tubeOverride(L) {
  const hol = L.holiday;
  if (!hol || !hol.full) return null;
  if (hol.id === 'valentine') return (c, i) => (i % 2 ? '#ff9cc2' : '#ff4f8a');
  if (hol.id === 'stpatrick') return (c, i) => (i % 2 ? '#a8ffcf' : '#2bff86');
  if (hol.id === 'easter') return (c, i, s) => PASTEL[(i + s) % PASTEL.length];
  if (hol.id === 'july4') return (c, i, s) => RWB[(i + s) % RWB.length];
  return null;
}
function bulbColor(L, i, order) {
  const hol = L.holiday;
  if (!hol) return BULB;
  const on = order < (hol.full ? 1 : hol.k);       // during a build-up, more bulbs change colour each day
  if (!on) return BULB;
  switch (hol.id) {
    case 'halloween': return i % 2 ? '#a24dff' : '#ff8a1e';
    case 'thanksgiving': return '#ffb040';
    case 'christmas': return i % 2 ? '#24e06a' : '#ff2e45';
    case 'valentine': return i % 2 ? '#ffb3d1' : '#ff4f8a';
    case 'stpatrick': return '#3dff8b';
    case 'easter': return PASTEL[i % PASTEL.length];
    case 'july4': return RWB[i % RWB.length];
    case 'nye': return '#ffd27a';
    default: return BULB;
  }
}
function tickerColor(L) {
  const id = L.holiday && L.holiday.id;
  return { halloween: '#ff8a2a', christmas: '#ff4a4a', valentine: '#ff6fa6', stpatrick: '#3dff8b', july4: '#ff5060', nye: '#ffd27a', thanksgiving: '#ffb040', easter: '#d2b8ff' }[id] || '#ffb547';
}

export function createSigns({ games: allGames = [] } = {}) {
  const games = allGames.filter(g => g.playable !== false);
  const R = Math.min(2, window.devicePixelRatio || 1);
  const sprites = new Map();
  const glow = col => { let c = sprites.get(col); if (!c) { c = mk(64, 64); const x = c.getContext('2d'); const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, rgba(col, 1)); g.addColorStop(0.3, rgba(col, 0.38)); g.addColorStop(1, rgba(col, 0)); x.fillStyle = g; x.fillRect(0, 0, 64, 64); sprites.set(col, c); } return c; };
  let canShow = () => true;
  let signs = [], placedKey = '', rot = null, lastOn = false, overKey = '', tickerMsg = '', drops = [], log = [];
  let env = { W: 1, H: 1, HZ: 1 };

  // ================================================================== tubes (the main sign's recipe)
  // items: [{ p: Path2D, col, ends, clips }]; w = tube width in path units; k = device px per path unit
  function glassTubes(x, items, w) {
    x.lineCap = 'round'; x.lineJoin = 'round';
    for (const t of items) { x.strokeStyle = mixHex(t.col, '#120c18', 0.8); x.lineWidth = w + w * 0.18; x.stroke(t.p); }
    x.save(); x.translate(-w * 0.16, -w * 0.16); x.strokeStyle = 'rgba(255,255,255,0.13)'; x.lineWidth = w * 0.14;
    for (const t of items) x.stroke(t.p);
    x.restore();
    for (const t of items) {
      for (const [ex, ey] of t.ends) { x.fillStyle = '#1b1320'; x.beginPath(); x.arc(ex, ey, w * 0.62, 0, TAU); x.fill(); x.strokeStyle = 'rgba(255,255,255,0.12)'; x.lineWidth = w * 0.12; x.stroke(); }
      for (const c of t.clips) { x.save(); x.translate(c.x, c.y); x.rotate(c.ang + Math.PI / 2); x.fillStyle = 'rgba(20,15,26,0.92)'; x.fillRect(-w * 0.28, -w * 1.15, w * 0.56, w * 2.3); x.restore(); }
    }
  }
  function litTube(x, t, w, k, soft = false) {
    x.lineCap = 'round'; x.lineJoin = 'round';
    const pass = (col, width, blur, alpha) => {
      x.save(); const OFF = 6000 / k;
      x.translate(-OFF, 0); x.shadowOffsetX = OFF * k; x.shadowColor = col; x.shadowBlur = blur * k;
      x.globalAlpha = alpha; x.strokeStyle = col; x.lineWidth = width; x.stroke(t.p); x.restore();
    };
    if (soft) { pass(t.col, w * 3.4, w * 5.2, 0.5); pass(t.col, w * 2.0, w * 2.0, 0.85); }
    else { pass(t.col, w * 3.2, w * 5.5, 0.45); pass(t.col, w * 2.4, w * 2.8, 0.9); pass(t.col, w * 1.35, w * 1.0, 1); }
    x.strokeStyle = t.col; x.lineWidth = w; x.stroke(t.p);
    x.strokeStyle = mixHex(t.col, '#ffffff', 0.84); x.lineWidth = w * (soft ? 0.46 : 0.36); x.stroke(t.p);
    x.save(); x.translate(-w * 0.18, -w * 0.18); x.globalAlpha = 0.35; x.strokeStyle = '#ffffff'; x.lineWidth = w * 0.12; x.stroke(t.p); x.restore();
  }
  const prep = (d, col) => ({ p: new Path2D(d), col, ...tubeEnds(d) });

  // ================================================================== ICON: the game's mark on the wall
  function iconImages(s, g) {
    const S = s.w, pad = Math.round(S * 0.45), u = S / 100, k = u * R, w = 6.4;
    const m = markFor(games[g]);
    const over = s.over;
    const items = m.tubes.map((t, i) => prep(t.d, over ? over(t.col, i, s.idx) : t.col));
    const size = (S + pad * 2) * R;
    const base = mk(size, size), bx = base.getContext('2d');
    bx.setTransform(k, 0, 0, k, pad * R, pad * R);
    // a small transformer box under the mark, its wire running up behind
    bx.fillStyle = '#0d0b14'; bx.fillRect(44, 93, 12, 6); bx.fillStyle = 'rgba(255,255,255,0.08)'; bx.fillRect(44, 93, 12, 1);
    glassTubes(bx, items, w);
    const segs = items.map(t => { const c = mk(size, size), x = c.getContext('2d'); x.setTransform(k, 0, 0, k, pad * R, pad * R); litTube(x, t, w, k); return c; });
    return { base, segs, pad, col: items[0].col, rows: null };
  }

  // ================================================================== BLADE: a vertical cabinet, stacked tube letters, on brackets
  function bladeImages(s, g) {
    const bw = s.w, H = s.h, dir = s.dir, pad = Math.round(bw * 0.9), br = Math.round(bw * 0.5);
    const m = markFor(games[g]), word = bladeWord(games[g]);
    const col = s.over ? s.over(m.tubes[0].col, 0, s.idx) : m.tubes[0].col;
    const trim = s.over ? s.over(m.tubes[0].col, 1, s.idx) : (m.tubes[1] ? m.tubes[1].col : mixHex(col, '#ffffff', 0.35));
    const cw = (bw + pad * 2 + br) * R, ch = (H + pad * 2) * R;
    const ox = pad + (dir < 0 ? br : 0);   // brackets go toward the wall (dir: the wall's side)
    const capH = bw * 0.5, finH = bw * 0.42, top = capH, area = H - capH - finH;
    const base = mk(cw, ch), x = base.getContext('2d');
    x.setTransform(R, 0, 0, R, ox * R, pad * R);
    // brackets: two arms with braces back to the wall
    const wx = dir > 0 ? bw + br : -br;
    x.strokeStyle = '#17131f'; x.lineWidth = 2.2; x.lineCap = 'round';
    for (const yy of [top + 6, top + area - 6]) { x.beginPath(); x.moveTo(dir > 0 ? bw : 0, yy); x.lineTo(wx, yy); x.stroke(); x.beginPath(); x.moveTo(dir > 0 ? bw : 0, yy + 9); x.lineTo(wx, yy); x.lineWidth = 1.2; x.stroke(); x.lineWidth = 2.2; }
    x.fillStyle = '#1d1826'; for (const yy of [top + 6, top + area - 6]) x.fillRect(wx - 1.5, yy - 5, 3, 10);
    // the cabinet: dark lacquer, a gold hairline, an art-deco cap and finial
    const body = x.createLinearGradient(0, 0, bw, 0); body.addColorStop(0, '#0a0810'); body.addColorStop(0.5, '#16121f'); body.addColorStop(1, '#0a0810');
    x.fillStyle = body;
    x.beginPath(); x.moveTo(0, top); x.lineTo(bw, top); x.lineTo(bw, top + area); x.lineTo(bw * 0.5, H); x.lineTo(0, top + area); x.closePath(); x.fill();
    x.beginPath(); x.moveTo(bw * 0.12, top); x.lineTo(bw * 0.12, top - capH * 0.45); x.lineTo(bw * 0.3, top - capH * 0.45); x.lineTo(bw * 0.3, top - capH * 0.75); x.lineTo(bw * 0.7, top - capH * 0.75); x.lineTo(bw * 0.7, top - capH * 0.45); x.lineTo(bw * 0.88, top - capH * 0.45); x.lineTo(bw * 0.88, top); x.closePath(); x.fill();
    x.beginPath(); x.moveTo(bw * 0.5, 0); x.lineTo(bw * 0.58, top - capH * 0.75); x.lineTo(bw * 0.42, top - capH * 0.75); x.closePath(); x.fill();
    x.strokeStyle = 'rgba(200,170,110,0.5)'; x.lineWidth = 0.8;
    x.beginPath(); x.moveTo(0.5, top); x.lineTo(bw - 0.5, top); x.lineTo(bw - 0.5, top + area); x.lineTo(bw * 0.5, H - 0.6); x.lineTo(0.5, top + area); x.closePath(); x.stroke();
    // the tubes: a border tube inside the face (lights first), then the letters
    const inset = 3.2, tw = Math.max(1.3, bw * 0.06);
    const border = prep(`M${inset + 3} ${top + inset} H${bw - inset - 3} Q${bw - inset} ${top + inset} ${bw - inset} ${top + inset + 3} V${top + area - inset - 3} Q${bw - inset} ${top + area - inset} ${bw - inset - 3} ${top + area - inset} H${inset + 3} Q${inset} ${top + area - inset} ${inset} ${top + area - inset - 3} V${top + inset + 3} Q${inset} ${top + inset} ${inset + 3} ${top + inset} Z`, trim);
    const n = word.length;
    const lh = Math.min(bw * 0.66, (area - inset * 4) / (n * 1.24));
    const sc = lh / 14, lw = Math.max(1.8, lh * 0.15) / sc;
    const y0 = top + inset * 2 + (area - inset * 4 - n * lh * 1.24) / 2;
    const letters = [...word].map((ch, i) => ({ ...prep(LETTERS[ch] || LETTERS.O, col), ox: (bw - 10 * sc) / 2, oy: y0 + i * lh * 1.24 + lh * 0.12 }));
    // glass
    glassTubes(x, [border], tw);
    for (const L of letters) { x.save(); x.translate(L.ox, L.oy); x.scale(sc, sc); glassTubes(x, [L], lw); x.restore(); }
    // lit: the border, then one canvas row per letter
    const one = (draw) => { const c = mk(cw, ch), y = c.getContext('2d'); y.setTransform(R, 0, 0, R, ox * R, pad * R); draw(y); return c; };
    const segs = [one(y => litTube(y, border, tw, R, true))];
    for (const L of letters) segs.push(one(y => { y.translate(L.ox, L.oy); y.scale(sc, sc); litTube(y, L, lw, R * sc, true); }));
    return { base, segs, pad, ox, col, rows: null };
  }

  // ================================================================== MARQUEE: an art-deco crown with a letter board and chasing bulbs
  function marqueeFrame(s) {
    const mw = s.w, mh = s.h, pad = Math.round(mw * 0.22);
    const c = mk((mw + pad * 2) * R, (mh + pad * 2) * R), x = c.getContext('2d');
    x.setTransform(R, 0, 0, R, pad * R, pad * R);
    const metal = (y0, y1) => { const g = x.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, '#221d2c'); g.addColorStop(1, '#0c0a12'); return g; };
    const gold = 'rgba(214,180,112,0.75)';
    // the fan: a half sunburst behind the pediment
    x.save(); x.translate(mw / 2, mh * 0.16);
    for (let i = 0; i <= 8; i++) { const a = Math.PI + (i / 8) * Math.PI; x.strokeStyle = i % 2 ? 'rgba(214,180,112,0.35)' : 'rgba(214,180,112,0.6)'; x.lineWidth = 1.1; x.beginPath(); x.moveTo(Math.cos(a) * mw * 0.06, Math.sin(a) * mw * 0.06); x.lineTo(Math.cos(a) * mw * 0.2, Math.sin(a) * mw * 0.2 * 0.8); x.stroke(); }
    x.restore();
    // pediment tiers
    x.fillStyle = metal(0, mh * 0.3);
    x.fillRect(mw * 0.32, mh * 0.08, mw * 0.36, mh * 0.1);
    x.fillRect(mw * 0.16, mh * 0.16, mw * 0.68, mh * 0.1);
    x.strokeStyle = gold; x.lineWidth = 0.8;
    x.strokeRect(mw * 0.32 + 0.4, mh * 0.08 + 0.4, mw * 0.36 - 0.8, mh * 0.1 - 0.8);
    x.strokeRect(mw * 0.16 + 0.4, mh * 0.16 + 0.4, mw * 0.68 - 0.8, mh * 0.1 - 0.8);
    // the header strip and the board's frame
    x.fillStyle = metal(mh * 0.24, mh * 0.92);
    x.fillRect(0, mh * 0.25, mw, mh * 0.66);
    x.strokeStyle = gold; x.strokeRect(0.5, mh * 0.25 + 0.5, mw - 1, mh * 0.66 - 1);
    x.strokeStyle = 'rgba(214,180,112,0.35)'; x.strokeRect(mw * 0.05, mh * 0.38, mw * 0.9, mh * 0.44);
    // ledge + the legs into the tower
    x.fillStyle = '#0b0910'; x.fillRect(-mw * 0.02, mh * 0.9, mw * 1.04, mh * 0.05);
    x.fillStyle = gold; x.fillRect(-mw * 0.02, mh * 0.9, mw * 1.04, 0.8);
    x.fillStyle = '#100d16'; for (const lx of [0.14, 0.86]) x.fillRect(mw * lx - 2.5, mh * 0.95, 5, mh * 0.05 + 2);
    // header lettering (glass by day; lit in the frame-light canvas)
    const fs = Math.max(6, mh * 0.085);
    x.font = `700 ${fs}px "Chakra Petch", sans-serif`; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillStyle = 'rgba(70,40,48,0.9)'; x.fillText('NOW  PLAYING', mw / 2, mh * 0.315);
    // bulb sockets
    x.fillStyle = 'rgba(30,24,36,1)';
    for (const b of s.bulbs) { x.beginPath(); x.arc(b.x, b.y, s.br * 1.25, 0, TAU); x.fill(); }
    x.fillStyle = 'rgba(120,100,80,0.35)';
    for (const b of s.bulbs) { x.beginPath(); x.arc(b.x, b.y, s.br * 0.7, 0, TAU); x.fill(); }
    // the lit header (red neon lettering) + warm light on the gold trim
    const lit = mk(c.width, c.height), y = lit.getContext('2d');
    y.setTransform(R, 0, 0, R, pad * R, pad * R);
    y.font = x.font; y.textAlign = 'center'; y.textBaseline = 'middle';
    y.shadowColor = '#ff3a4e'; y.shadowBlur = 6 * R; y.fillStyle = '#ff6a78'; y.fillText('NOW  PLAYING', mw / 2, mh * 0.315);
    y.shadowBlur = 0; y.fillStyle = '#ffe3e6'; y.globalAlpha = 0.85; y.fillText('NOW  PLAYING', mw / 2, mh * 0.315);
    y.globalAlpha = 0.5; y.strokeStyle = '#ffd99a'; y.lineWidth = 0.8; y.strokeRect(0.5, mh * 0.25 + 0.5, mw - 1, mh * 0.66 - 1);
    return { base: c, lit, pad };
  }
  function boardImages(s, g) {
    const bwid = s.w * 0.88, bh = s.h * 0.42;
    const name = games[g].name.toUpperCase();
    const make = on => {
      const c = mk(bwid * R, bh * R), x = c.getContext('2d');
      x.setTransform(R, 0, 0, R, 0, 0);
      const pan = x.createLinearGradient(0, 0, 0, bh);
      if (on) { pan.addColorStop(0, '#fff8e8'); pan.addColorStop(0.5, '#ffefcf'); pan.addColorStop(1, '#ffdca0'); }
      else { pan.addColorStop(0, '#4a4450'); pan.addColorStop(1, '#2e2a35'); }
      x.fillStyle = pan; x.fillRect(0, 0, bwid, bh);
      // the letter tracks of a real board
      x.fillStyle = on ? 'rgba(120,80,30,0.12)' : 'rgba(0,0,0,0.15)';
      for (let yy = bh * 0.08; yy < bh; yy += bh * 0.16) x.fillRect(0, yy, bwid, 0.6);
      // the name: one line if it fits, else two
      const words = name.split(' ');
      const lines = words.length > 1 && words.join(' ').length > 9 ? [words.slice(0, Math.ceil(words.length / 2)).join(' '), words.slice(Math.ceil(words.length / 2)).join(' ')] : [name];
      let fs = bh * (lines.length > 1 ? 0.4 : 0.62);
      x.font = `800 ${fs}px "Chakra Petch", sans-serif`;
      while (fs > 5 && Math.max(...lines.map(l => x.measureText(l).width)) > bwid * 0.9) { fs -= 0.5; x.font = `800 ${fs}px "Chakra Petch", sans-serif`; }
      x.textAlign = 'center'; x.textBaseline = 'middle';
      if ('letterSpacing' in x) x.letterSpacing = `${fs * 0.08}px`;
      x.fillStyle = on ? '#16101a' : 'rgba(18,14,22,0.9)';
      lines.forEach((l, i) => x.fillText(l, bwid / 2, bh * (lines.length > 1 ? 0.3 + i * 0.42 : 0.53)));
      // a soft inner shadow at the top edge
      const sh = x.createLinearGradient(0, 0, 0, bh * 0.2); sh.addColorStop(0, 'rgba(0,0,0,0.25)'); sh.addColorStop(1, 'rgba(0,0,0,0)');
      x.fillStyle = sh; x.fillRect(0, 0, bwid, bh * 0.2);
      return c;
    };
    return { lit: make(true), dark: make(false), bw: bwid, bh };
  }
  function webOverlay(s) {
    const c = mk((s.w + 40) * R, (s.h + 40) * R), x = c.getContext('2d');
    x.setTransform(R, 0, 0, R, 20 * R, 20 * R);
    x.strokeStyle = 'rgba(240,232,255,0.55)'; x.lineWidth = 0.45;
    for (const [cx, cy, sx] of [[0, s.h * 0.25, 1], [s.w, s.h * 0.25, -1]]) {
      const r = s.w * 0.2;
      for (let i = 0; i <= 5; i++) { const a = (i / 5) * Math.PI / 2; x.beginPath(); x.moveTo(cx, cy); x.lineTo(cx + sx * Math.cos(a) * r, cy + Math.sin(a) * r); x.stroke(); }
      for (let k = 1; k <= 4; k++) { const rr = (k / 4.4) * r; x.beginPath(); for (let i = 0; i <= 5; i++) { const a = (i / 5) * Math.PI / 2; const px = cx + sx * Math.cos(a) * rr, py = cy + Math.sin(a) * rr; if (i === 0) x.moveTo(px, py); else { const pa = ((i - 0.5) / 5) * Math.PI / 2; x.quadraticCurveTo(cx + sx * Math.cos(pa) * rr * 0.86, cy + Math.sin(pa) * rr * 0.86, px, py); } } x.stroke(); }
      x.fillStyle = 'rgba(255,240,250,0.9)'; for (let k = 0; k < 4; k++) { x.beginPath(); x.arc(cx + sx * r * (0.3 + 0.12 * k), cy + r * (0.2 + 0.1 * k), 0.6, 0, TAU); x.fill(); }
    }
    return c;
  }

  // ================================================================== TICKER: a dot-matrix band scrolling the message
  function tickerBase(s) {
    const c = mk(s.w * R, s.h * R), x = c.getContext('2d');
    x.setTransform(R, 0, 0, R, 0, 0);
    const g = x.createLinearGradient(0, 0, 0, s.h); g.addColorStop(0, '#2e2836'); g.addColorStop(0.12, '#0a080e'); g.addColorStop(0.88, '#0a080e'); g.addColorStop(1, '#2e2836');
    x.fillStyle = g; x.fillRect(0, 0, s.w, s.h);
    // the band wraps the corner: the last few px fold into shadow
    const fold = x.createLinearGradient(s.w - s.w * 0.08, 0, s.w, 0); fold.addColorStop(0, 'rgba(0,0,0,0)'); fold.addColorStop(1, 'rgba(0,0,0,0.6)');
    x.fillStyle = fold; x.fillRect(s.w * 0.92, 0, s.w * 0.08, s.h);
    x.fillStyle = 'rgba(255,170,90,0.07)';
    for (let col = 0; col * s.p < s.w; col++) for (let row = 0; row < 7; row++) { x.beginPath(); x.arc(col * s.p + s.p / 2, s.p * 1.2 + row * s.p, s.p * 0.3, 0, TAU); x.fill(); }
    return c;
  }
  function tickerStrip(s, text, col, names = [], ids = []) {
    const cols = [], at = [];
    for (const ch of text.toUpperCase()) { at.push(cols.length); const gl = FONT[ch] || FONT[' ']; const w = gl[0].length; for (let cx = 0; cx < w; cx++) cols.push(gl.map(row => row[cx] === '1')); cols.push(null); }
    const gap = Math.ceil(s.w / s.p * 0.6);
    for (let i = 0; i < gap; i++) cols.push(null);
    const W = cols.length * s.p;
    const c = mk(W * R, s.h * R), x = c.getContext('2d');
    x.setTransform(R, 0, 0, R, 0, 0);
    const halo = rgba(col, 0.42);
    cols.forEach((cl, i) => { if (!cl) return; cl.forEach((on, row) => { if (!on) return; const px = i * s.p + s.p / 2, py = s.p * 1.2 + row * s.p; x.fillStyle = halo; x.beginPath(); x.arc(px, py, s.p * 0.72, 0, TAU); x.fill(); x.fillStyle = col; x.beginPath(); x.arc(px, py, s.p * 0.44, 0, TAU); x.fill(); x.fillStyle = mixHex(col, '#ffffff', 0.7); x.beginPath(); x.arc(px, py, s.p * 0.22, 0, TAU); x.fill(); }); });
    // the columns each game's name covers
    const spans = [];
    let from = Math.max(0, text.indexOf('NOW PLAYING'));
    names.forEach((n, i) => { const k = text.indexOf(n, from); if (k < 0) return; spans.push({ c0: at[k], c1: at[k + n.length - 1] + 5, id: ids[i] }); from = k + n.length; });
    return { c, w: W, spans, cols: cols.length };
  }

  // ================================================================== placement
  // In screen space: clear zones (the sign + tagline, the corner buttons, the dock) come from the title. The marquee crowns
  // a near tower on one side, the blade hangs off a near tower on the other, an icon sits mid-skyline near the middle, the
  // ticker wraps a building elsewhere, and on wide screens a second icon sits far back. Signs never overlap each other,
  // clear zones or the nearer buildings in front of them.
  function place(layers, clear) {
    const { W, H, HZ } = env;
    const sc = W >= 900 && H < W ? Math.min(1.7, Math.max(1.2, H / 560)) : Math.min(1.35, Math.max(0.9, Math.min(W, H * 0.62) / 390));
    const zones = clear.map(z => ({ x: z.x - 10, y: z.y - 10, w: z.w + 20, h: z.h + 20 }));
    const used = [];
    const scr = (L, r) => ({ x: r.x - L.margin, y: L.top + r.y, w: r.w, h: r.h, r });
    const occluded = (box, li) => { for (let j = li + 1; j < layers.length; j++) for (const r of layers[j].rects) if (hit(box, scr(layers[j], r))) return true; return false; };
    const free = (box, li, glowPad = 6) => {
      const g = { x: box.x - glowPad, y: box.y - glowPad, w: box.w + glowPad * 2, h: box.h + glowPad * 2 };
      const why = !(box.x > 4 && box.x + box.w < W - 4) ? 'x' : !(box.y > 4 && box.y + box.h < HZ - 6) ? 'y' : zones.some(z => hit(g, z)) ? 'zone' : used.some(u => hit(g, u)) ? 'used' : occluded(box, li) ? 'occ' : '';
      return !why;
    };
    const out = [];
    const near = layers[3], mid = layers[2], far = layers[1];
    const towers = near.rects.map(r => scr(near, r)).filter(b => b.h > HZ * 0.08 && b.w > 40 * sc);
    // the blades: one off the inner edge of a near tower on each side (the outer edge if the inner one is taken); the host
    // tower's roofline and its blade-side edge are lined with a neon trim in the blade's colour
    const midTowers = mid.rects.map(r => scr(mid, r)).filter(b => b.h > HZ * 0.12);
    for (const bside of [-1, 1]) {
      let done = false;
      const Lmin = H < 760 ? 12.5 : 15;   // the smallest readable letter (short Safari screens get a little less)
      for (const kk of [1, 0.88, 0.76, 0.66, 0.58]) { if (done) break; const bw = 30 * sc * kk;
        for (const [b, bli] of [...towers.map(t => [t, 3]), ...(W >= 760 ? midTowers.map(t => [t, 2]) : [])].filter(([t]) => (t.x + t.w / 2 < W / 2 ? -1 : 1) === bside).sort((p, q) => p[1] === q[1] ? p[0].y - q[0].y : q[1] - p[1])) {
          // start below any clear zone over this tower (the tagline reaches low on short screens)
          let top = b.y + 10;
          for (const z of zones) if (z.x < b.x + b.w + bw + 12 && z.x + z.w > b.x - bw - 12 && z.y < top + 20 && z.y + z.h > top - 6) top = Math.max(top, z.y + z.h + 14);
          const bottom = Math.min(HZ - 14, b.y + b.h - 8), h = Math.min(bottom - top, 210 * Math.min(sc, 1.15) * kk);
          if (h < 80) continue;
          const area = h - bw * 0.5 - bw * 0.42, cap = Math.floor((area - 3.2 * 4) / (Lmin * Math.min(sc, 1.15) * 1.24));
          if (cap < 5) continue;
          for (const edge of [bside, -bside]) {        // the edge it hangs from: inner first
            const x = edge < 0 ? b.x + b.w + 5 : b.x - bw - 5;
            const box = { x, y: top, w: bw, h };
            if (!free(box, bli, 6)) continue;
            if (W >= 760 && box.x + box.w / 2 > W * 0.3 && box.x + box.w / 2 < W * 0.7) continue;
            out.push({ type: 'blade', li: bli, box, dir: edge < 0 ? -1 : 1, cap, host: b.r }); used.push(box); done = true; break;
          }
          if (done) break;
        }
      }
    }
    // the icon: mid skyline, near the middle
    const iconAt = (L, li, Smax, pref) => {
      const cands = [];
      for (const r of L.rects) {
        const b = scr(L, r);
        const S = Math.min(Smax, b.w - 6);
        if (S < Smax * 0.74) continue;
        for (let yy = b.y + 10; yy + S < Math.min(HZ - 10, b.y + b.h - 6); yy += 6) {
          const box = { x: b.x + (b.w - S) / 2, y: yy, w: S, h: S };
          if (free(box, li, 12)) { cands.push({ box, score: pref(box) }); break; }
        }
      }
      cands.sort((a, b) => a.score - b.score);
      return cands[0] ? cands[0].box : null;
    };
    const S1 = 54 * sc;
    const centred = box => Math.abs(box.x + box.w / 2 - W / 2) + (box.y - HZ * 0.5) * 0.3;
    const ib = iconAt(mid, 2, S1, centred) || iconAt(mid, 2, S1 * 0.78, centred) || iconAt(mid, 2, S1 * 0.62, centred);
    if (ib) { out.push({ type: 'icon', li: 2, box: ib }); used.push(ib); }
    // the ticker: a band near the top of a building, as far from the others as possible
    const p = Math.max(2.3, Math.min(2.9, 2.4 * sc));
    const th = p * 9.4;
    let best = null;
    for (const [L, li] of [[mid, 2], [far, 1], [near, 3]]) for (const r of L.rects) {
      const b = scr(L, r);
      const tw = Math.min(170 * sc, b.w - 6);
      if (tw < 56 * sc) continue;
      for (let yy = b.y + 8; yy + th < Math.min(HZ - 12, b.y + b.h - 6); yy += 8) {
        const box = { x: b.x + 3, y: yy, w: tw, h: th };
        if (!free(box, li, 8)) continue;
        const spread = Math.min(...used.map(u => Math.hypot(u.x + u.w / 2 - (box.x + box.w / 2), u.y + u.h / 2 - (box.y + box.h / 2))), 9999);
        const score = spread - (li === 1 ? 40 : li === 3 ? 90 : 0) - Math.abs(yy - HZ * 0.62) * 0.2 + Math.min(tw, 120) * 0.4;
        if (!best || score > best.score) best = { box, li, score };
        break;
      }
    }
    if (best) { out.push({ type: 'ticker', li: best.li, box: best.box, p }); used.push(best.box); }
    // wide screens: a second icon, far back
    if (W >= 760 && H < W) {
      const S2 = 50 * sc;
      const spreadOf = box => -Math.min(...used.map(u => Math.hypot(u.x + u.w / 2 - box.x - box.w / 2, u.y + u.h / 2 - box.y - box.h / 2)));
      const b2 = iconAt(far, 1, S2, spreadOf) || iconAt(mid, 2, S2, spreadOf) || iconAt(far, 1, S2 * 0.75, spreadOf) || iconAt(mid, 2, S2 * 0.75, spreadOf);
      if (b2) { const li2 = far.rects.some(r => { const b = scr(far, r); return b2.x >= b.x - 1 && b2.x + b2.w <= b.x + b.w + 1 && b2.y >= b.y; }) ? 1 : 2; out.push({ type: 'icon', li: li2, box: b2 }); used.push(b2); }
      // no room for a readable blade (wide but short screens): one more icon keeps five signs
      if (out.filter(o => o.type === 'blade').length < 2) {
        const b3 = iconAt(mid, 2, S2, spreadOf) || iconAt(far, 1, S2, spreadOf) || iconAt(mid, 2, S2 * 0.75, spreadOf);
        if (b3) { const li3 = mid.rects.some(r => { const b = scr(mid, r); return b3.x >= b.x - 1 && b3.x + b3.w <= b.x + b.w + 1 && b3.y >= b.y; }) ? 2 : 1; out.push({ type: 'icon', li: li3, box: b3 }); used.push(b3); }
      }
    }
    return out.map((o, i) => ({ ...o, idx: i, x: o.box.x + layers[o.li].margin, y: o.box.y - layers[o.li].top, w: o.box.w, h: o.box.h }));
  }

  // ================================================================== build a sign's images for a game
  function dress(s, g) {
    s.game = g;
    if (s.type === 'icon') s.img = iconImages(s, g);
    else if (s.type === 'blade') s.img = bladeImages(s, g);
    else if (s.type === 'marquee') s.board = boardImages(s, g);
  }
  function setup(s, L) {
    s.over = tubeOverride(L);
    s.fl = 20 + Math.random() * 40; s.flick = -9;
    s.pw = { on: false, t0: -99 };
    if (s.type === 'marquee') {
      const n = Math.max(10, Math.round(s.w / 7.5));
      const bulbs = [];
      const y1 = s.h * 0.355, y2 = s.h * 0.865;
      for (let i = 0; i < n; i++) bulbs.push({ x: s.w * (0.06 + 0.88 * i / (n - 1)), y: y1 });
      const side = Math.max(3, Math.round((y2 - y1) / 8));
      for (let i = 1; i < side; i++) bulbs.push({ x: s.w * 0.97, y: y1 + (y2 - y1) * i / side });
      for (let i = n - 1; i >= 0; i--) bulbs.push({ x: s.w * (0.06 + 0.88 * i / (n - 1)), y: y2 });
      for (let i = side - 1; i >= 1; i--) bulbs.push({ x: s.w * 0.03, y: y1 + (y2 - y1) * i / side });
      s.bulbs = bulbs; s.br = Math.max(0.9, s.w * 0.0085);
      s.order = bulbs.map((_, i) => ((i * 7919) % 101) / 101);
      s.frame = marqueeFrame(s);
      s.web = null;
    }
    if (s.type === 'ticker') { s.base = tickerBase(s); s.off = 0; }
  }

  // ================================================================== per frame
  function segAlpha(s, i, n, t, motion) {
    // the power: tube by tube at dusk (and at the boot), all off together at dawn
    let a;
    const e = t - s.pw.t0;
    if (!motion) a = s.pw.on ? clamp01((e - i * 0.05) / 0.4) : 1 - clamp01(e / 0.4);
    else if (s.pw.on) { const q = e - i * 0.16; a = q < 0 ? 0 : q < 0.03 ? 1 : q < 0.07 ? 0.15 : q < 0.11 ? 0.9 : q < 0.14 ? 0.3 : 1; }
    else { const q = e - i * 0.03; a = q < 0 ? 1 : q < 0.05 ? 0.3 : q < 0.09 ? 0.85 : q < 0.13 ? 0.1 : 0; }
    // a game change: the tubes go out, the new mark buzzes on tube by tube
    if (s.tr) {
      const q = t - s.tr.t0;
      if (q < 0.34) a *= motion ? (q < 0.08 ? 0.6 : q < 0.12 ? 1 : q < 0.2 ? 0.3 : 1 - (q - 0.2) / 0.14) : 1 - q / 0.34;
      else { const r = q - 0.42 - i * (motion ? 0.13 : 0.03); a *= r < 0 ? 0 : !motion ? clamp01(r / 0.3) : r < 0.03 ? 1 : r < 0.07 ? 0.2 : r < 0.1 ? 1 : 1; }
    }
    // a rare, small flicker
    if (motion && t - s.flick < 0.32) { const q = t - s.flick; a *= q < 0.05 ? 0.35 : q < 0.1 ? 1 : q < 0.15 ? 0.5 : 1; }
    return clamp01(a);
  }

  const api = {
    reset() { placedKey = ''; },
    tick(t, dt, o) {
      env = { W: o.W, H: o.H, HZ: o.HZ };
      if (!games.length) return;
      const key = `${o.W}|${o.H}|${(o.clear || []).map(z => `${Math.round(z.x / 40)},${Math.round(z.y / 40)},${Math.round(z.w / 40)},${Math.round(z.h / 40)}`).join(';')}`;
      if (key !== placedKey && o.clear) {
        placedKey = key;
        signs = place(o.layers, o.clear);
        const flips = signs.filter(s => s.type !== 'ticker');
        canShow = (i, g) => flips[i].type !== 'blade' || bladeWord(games[g]).length <= flips[i].cap;
        rot = { ...createRotation(flips.length, games.length, Math.floor(Math.random() * games.length), canShow), at: t };
        flips.forEach((s, i) => { setup(s, o.L); dress(s, rot.shown[i]); });
        signs.filter(s => s.type === 'ticker').forEach(s => setup(s, o.L));
        lastOn = false; tickerMsg = '';
        overKey = '';
      }
      // holiday dress: re-render the tubes when the holiday's colours change
      const ok = `${o.L.holiday ? o.L.holiday.id + (o.L.holiday.full ? 'F' : '') : ''}`;
      if (ok !== overKey) {
        overKey = ok;
        for (const s of signs) { s.over = tubeOverride(o.L); if (s.type !== 'ticker') dress(s, s.game); if (s.type === 'marquee') s.web = o.L.holiday && o.L.holiday.id === 'halloween' && o.L.holiday.full ? webOverlay(s) : null; }
      }
      // power: on after dusk (and once the title's boot has reached the signs), off by day
      const on = o.P.sign > 0.5 && o.bill > 0.4;
      if (on !== lastOn) { lastOn = on; signs.forEach((s, i) => { s.pw = { on, t0: t + (on ? 0.25 + i * 0.6 : Math.random() * 0.25) }; }); }
      // the rotation: one sign changes at a time
      const flips = signs.filter(s => s.type !== 'ticker');
      if (rot && flips.length) {
        const res = rotate(rot, games.length, t, canShow);
        rot = res.r;
        if (res.change) {
          const s = flips[res.change.sign];
          log.push({ t: +t.toFixed(2), sign: s.type, game: games[res.change.game].id }); if (log.length > 60) log.shift();
          if (s.type === 'marquee') { s.flip = { t0: t, from: s.board }; dress(s, res.change.game); }
          else if (on) { s.tr = { t0: t, to: res.change.game }; }
          else dress(s, res.change.game);
        }
      }
      for (const s of flips) {
        if (s.tr && t - s.tr.t0 >= 0.34 && s.game !== s.tr.to) dress(s, s.tr.to);
        if (s.tr && t - s.tr.t0 > 3) s.tr = null;
        if (s.flip && t - s.flip.t0 > 1.4) s.flip = null;
        if (o.motion && t > s.fl) { s.flick = t; s.fl = t + 25 + Math.random() * 45; }
      }
      // the ticker's message
      const ts = signs.find(s => s.type === 'ticker');
      if (ts) {
        const order = rot ? [...rot.shown, ...games.map((_, i) => i).filter(i => !rot.shown.includes(i))] : games.map((_, i) => i);
        const names = order.map(i => games[i].name.toUpperCase());
        const msg = tickerText(o.L, names) + '|' + tickerColor(o.L);
        if (msg !== tickerMsg) { tickerMsg = msg; const [text, col] = msg.split('|'); ts.strip = tickerStrip(ts, text, col, names, order.map(i => games[i].id)); ts.col = col; }
        ts.off += (o.motion ? 24 : 14) * (env.W > 700 ? 1.3 : 1) * dt / 1000;
      }
      api._t = t; api._motion = o.motion; api._tier = o.tier;
    },
    /** this layer's signs, at its offset (the layer's haze is drawn after, so far signs sit in it) */
    drawLayer(c, li, ox, oy, night) {
      const t = api._t || 0, motion = api._motion;
      for (const s of signs) {
        if (s.li !== li) continue;
        const x = ox + s.x, y = oy + s.y;
        s.sx = x; s.sy = y;
        const depth = NEAR_ALPHA[li];
        if (s.type === 'blade' && s.host && s.img) {
          const hr = s.host, hx = ox + hr.x, hy = oy + hr.y, edgeX = s.dir < 0 ? hx + hr.w - 1 : hx + 1;
          const tl = segAlpha(s, 0, 1, t, motion) * depth;
          const col = s.img.col;
          c.save(); c.lineCap = 'round';
          const path = () => { c.beginPath(); c.moveTo(hx + 1, hy + 1); c.lineTo(hx + hr.w - 1, hy + 1); c.moveTo(edgeX, hy + 1); c.lineTo(edgeX, Math.min(hy + hr.h, env.HZ) - 2); };
          c.globalAlpha = 0.5 * depth; c.strokeStyle = mixHex(col, '#120c18', 0.75); c.lineWidth = 2; path(); c.stroke();
          if (tl > 0.02) {
            c.globalCompositeOperation = 'lighter';
            c.globalAlpha = 0.35 * tl; c.strokeStyle = col; c.lineWidth = 5; c.shadowColor = col; c.shadowBlur = 8; path(); c.stroke();
            c.shadowBlur = 0; c.globalAlpha = 0.95 * tl; c.lineWidth = 1.4; path(); c.stroke();
            c.globalAlpha = 0.8 * tl; c.strokeStyle = mixHex(col, '#ffffff', 0.8); c.lineWidth = 0.6; path(); c.stroke();
          }
          c.restore(); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
        }
        if (s.type === 'icon' || s.type === 'blade') {
          const im = s.img; if (!im) continue;
          const bx = x - (s.type === 'blade' ? im.ox : im.pad), by = y - im.pad, bwid = im.base.width / R, bh = im.base.height / R;
          const segs = im.segs, alphas = segs.map((_, i) => segAlpha(s, i, segs.length, t, motion));
          const lit = alphas.reduce((a, b) => a + b, 0) / Math.max(1, segs.length);
          // light on the wall around it
          if (lit > 0.02) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.3 * lit * depth; const r = Math.max(s.w, s.h) * 1.15; c.drawImage(glow(im.col), x + s.w / 2 - r, y + s.h / 2 - r, r * 2, r * 2); c.globalCompositeOperation = 'source-over'; }
          c.globalAlpha = depth; c.drawImage(im.base, bx, by, bwid, bh);
          for (let i = 0; i < segs.length; i++) if (alphas[i] > 0.01) { c.globalAlpha = alphas[i] * depth; c.drawImage(segs[i], bx, by, bwid, bh); }
          c.globalAlpha = 1;
          s.lit = lit;
        } else if (s.type === 'marquee') {
          const fr = s.frame, bx = x - fr.pad, by = y - fr.pad, fw = fr.base.width / R, fh = fr.base.height / R;
          const a0 = segAlpha(s, 0, 3, t, motion), a1 = segAlpha(s, 1, 3, t, motion);
          if (a1 > 0.02) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.24 * a1; const r = s.w * 0.95; c.drawImage(glow('#ffcf8a'), x + s.w / 2 - r, y + s.h * 0.6 - r * 0.8, r * 2, r * 1.6); c.globalCompositeOperation = 'source-over'; }
          c.globalAlpha = 1; c.drawImage(fr.base, bx, by, fw, fh);
          // the board (flipping like a letter board when the game changes)
          const bd = s.board, bX = x + s.w * 0.06, bY = y + s.h * 0.4;
          const paint = (img, a, sx, sw, scaleY) => { if (a <= 0.01 || scaleY <= 0.01) return; c.globalAlpha = a; c.drawImage(img, sx * R, 0, sw * R, img.height, bX + sx, bY + bd.bh * (1 - scaleY) / 2, sw, bd.bh * scaleY); };
          const COLS = 9, cw = bd.bw / COLS;
          if (!s.flip) { c.globalAlpha = 1; c.drawImage(bd.dark, bX, bY, bd.bw, bd.bh); if (a1 > 0.01) { c.globalAlpha = a1; c.drawImage(bd.lit, bX, bY, bd.bw, bd.bh); } }
          else {
            // split-flap: cells cascade left to right; in each, the old top half folds down over its hinge (darkening as it
            // turns away), then the new bottom half falls into place (brightening as it faces you), with a fine split line
            const half = bd.bh / 2, from = s.flip.from;
            const piece = (img, a, sx, top, h, y, hh) => { if (a <= 0.01 || hh <= 0.2) return; c.globalAlpha = a; c.drawImage(img, sx * R, (top ? 0 : half) * R, cw * R, h * R, bX + sx, y, cw, hh); };
            for (let k = 0; k < COLS; k++) {
              const sx = k * cw;
              const p = motion ? clamp01((t - s.flip.t0 - k * 0.075) / 0.42) : clamp01((t - s.flip.t0) / 0.35);
              c.globalAlpha = 1; c.fillStyle = '#100c14'; c.fillRect(bX + sx, bY, cw, bd.bh);
              for (const [kind, a] of [['dark', 1], ['lit', a1]]) {
                if (a <= 0.01) continue;
                const NEW = bd[kind], OLD = from[kind];
                if (p <= 0) { piece(OLD, a, sx, true, half, bY, half); piece(OLD, a, sx, false, half, bY + half, half); continue; }
                if (p >= 1) { piece(NEW, a, sx, true, half, bY, half); piece(NEW, a, sx, false, half, bY + half, half); continue; }
                // behind the flaps: the new top, the old bottom
                piece(NEW, a, sx, true, half, bY, half);
                if (p < 0.5) {
                  piece(OLD, a, sx, false, half, bY + half, half);
                  const f = Math.cos(p * Math.PI);                 // the old top folding down to the hinge
                  piece(OLD, a, sx, true, half, bY + half - half * f, half * f);
                  if (kind === 'dark') { c.globalAlpha = 0.55 * (1 - f); c.fillStyle = '#000'; c.fillRect(bX + sx, bY + half - half * f, cw, half * f); }
                } else {
                  piece(OLD, a, sx, false, half, bY + half, half);
                  const f = -Math.cos(p * Math.PI);                // the new bottom falling from the hinge
                  piece(NEW, a, sx, false, half, bY + half, half * f);
                  if (kind === 'dark') { c.globalAlpha = 0.45 * (1 - f); c.fillStyle = '#000'; c.fillRect(bX + sx, bY + half, cw, half * f); }
                }
              }
              // the cell's edges while it turns
              c.globalAlpha = 0.6; c.fillStyle = '#0a070d'; c.fillRect(bX + sx + cw - 0.6, bY, 0.6, bd.bh);
            }
            c.globalAlpha = 0.7; c.fillStyle = '#0a070d'; c.fillRect(bX, bY + half - 0.35, bd.bw, 0.7);
          }
          c.globalAlpha = a0; c.drawImage(fr.lit, bx, by, fw, fh);
          // the bulbs: a chase of light around the board
          const n = s.bulbs.length, low = api._tier === 0;
          c.globalCompositeOperation = 'lighter';
          for (let i = 0; i < n; i++) {
            const ba = segAlpha(s, 2 + Math.floor(i / n * 6), 9, t, motion);
            if (ba <= 0.01) continue;
            const b = s.bulbs[i], col = bulbColor(LK_(), i, s.order[i]);
            const chase = motion ? 0.45 + 0.55 * (((i + Math.floor(t * 9)) % 3) === 0 ? 1 : 0.25) : 0.8;
            const px = x + b.x, py = y + b.y;
            if (!low || i % 2 === 0) { c.globalAlpha = ba * chase * 0.75; c.drawImage(glow(col), px - s.br * 4.5, py - s.br * 4.5, s.br * 9, s.br * 9); }
            c.globalAlpha = ba * (0.55 + 0.45 * chase); c.fillStyle = col; c.beginPath(); c.arc(px, py, s.br, 0, TAU); c.fill();
          }
          c.globalCompositeOperation = 'source-over';
          if (s.web) { c.globalAlpha = 0.9; c.drawImage(s.web, x - 20, y - 20, s.web.width / R, s.web.height / R); }
          c.globalAlpha = 1;
          s.lit = a1;
        } else if (s.type === 'ticker') {
          if (!s.strip) continue;
          const tdepth = 1;
          const a = segAlpha(s, 0, 1, t, motion) * tdepth;
          c.globalAlpha = tdepth; c.drawImage(s.base, x, y, s.w, s.h);
          if (a > 0.01) {
            if (a > 0.05) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.24 * a; c.drawImage(glow(s.col), x - s.w * 0.1, y - s.h * 2, s.w * 1.2, s.h * 5); c.globalCompositeOperation = 'source-over'; }
            c.save(); c.beginPath(); c.rect(x + 1, y, s.w - 2, s.h); c.clip();
            const off = s.off % s.strip.w, sx = x + s.w - off;
            c.globalAlpha = a;
            c.drawImage(s.strip.c, sx, y, s.strip.w, s.h);
            if (sx + s.strip.w < x + s.w) c.drawImage(s.strip.c, sx + s.strip.w, y, s.strip.w, s.h);
            if (sx > x) c.drawImage(s.strip.c, sx - s.strip.w, y, s.strip.w, s.h);
            c.restore();
          }
          c.globalAlpha = 1;
          s.lit = a;
        }
      }
    },
    /** colour in the wet street under each lit sign */
    reflect(streak, H, HZ, t) {
      for (const s of signs) {
        if (!s.lit || s.lit < 0.05 || s.sx == null) continue;
        const col = s.type === 'marquee' ? '#ffcf8a' : s.type === 'ticker' ? (s.col || '#ffb547') : (s.img ? s.img.col : '#9fd8ff');
        streak(s.sx + s.w / 2, Math.max(s.w, 20) * 0.9, (H - HZ) * (s.li === 3 ? 0.6 : 0.42), col, (s.type === 'marquee' ? 0.14 : 0.1) * s.lit * NEAR_ALPHA[s.li], t, s.idx);
      }
    },
    /** rain catching the sign light: short coloured streaks falling through the glow */
    rain(c, dt) {
      const bright = signs.filter(s => (s.type === 'marquee' || s.type === 'blade') && s.lit > 0.3 && s.sx != null);
      if (!bright.length) { drops = []; return; }
      if (drops.length < 26 * bright.length) for (const s of bright) if (Math.random() < 0.5) {
        const r = Math.max(s.w, s.h) * 0.7;
        drops.push({ s, x: s.sx + s.w / 2 + (Math.random() - 0.5) * r * 2, y: s.sy + s.h / 2 - r + Math.random() * r * 0.4, v: 420 + Math.random() * 200, life: 0, r });
      }
      c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
      drops = drops.filter(d => {
        d.life += dt / 1000; d.y += d.v * dt / 1000; d.x += 30 * dt / 1000;
        const cx = d.s.sx + d.s.w / 2, cy = d.s.sy + d.s.h / 2, dist = Math.hypot(d.x - cx, d.y - cy) / d.r;
        if (dist > 1.3 || d.life > 1) return false;
        const col = d.s.type === 'marquee' ? '#ffd9a0' : d.s.img ? d.s.img.col : '#ffffff';
        c.globalAlpha = 0.5 * (1 - dist) * d.s.lit; c.strokeStyle = col; c.lineWidth = 0.8;
        c.beginPath(); c.moveTo(d.x, d.y); c.lineTo(d.x - 1.5, d.y - 9); c.stroke();
        return true;
      });
      c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
    },
    /** a tap: the sign under it (generous, thumb-sized areas) → { id } */
    hit(x, y) {
      for (const s of signs.slice().sort((a, b) => b.li - a.li)) {
        if (s.sx == null) continue;
        const padX = Math.max(10, (44 - s.w) / 2), padY = Math.max(10, (44 - s.h) / 2);
        if (x >= s.sx - padX && x <= s.sx + s.w + padX && y >= s.sy - padY && y <= s.sy + s.h + padY) {
          if (s.type === 'ticker') {
            // the name under the finger (or the nearest one scrolling by)
            const st = s.strip;
            if (!st || !st.spans.length) return { id: games[rot ? rot.shown[0] : 0].id, sign: 'ticker' };
            let lx = (x - s.sx - s.w + (s.off % st.w)) % st.w; if (lx < 0) lx += st.w;
            const col = lx / s.p;
            const dist = sp => (col >= sp.c0 && col <= sp.c1 ? 0 : Math.min(Math.abs(col - sp.c0), Math.abs(col - sp.c1), st.cols - Math.abs(col - sp.c0), st.cols - Math.abs(col - sp.c1)));
            const best = st.spans.slice().sort((a, b) => dist(a) - dist(b))[0];
            return { id: best.id, sign: 'ticker' };
          }
          return { id: games[s.game].id, sign: s.type };
        }
      }
      return null;
    },
    debug: () => ({ signs: signs.map(s => ({ type: s.type, li: s.li, game: s.game != null ? games[s.game].id : null, x: Math.round(s.sx), y: Math.round(s.sy), w: Math.round(s.w), h: Math.round(s.h), lit: +(s.lit || 0).toFixed(2) })), changes: log.slice(), on: lastOn, ticker: tickerMsg.split('|')[0] }),
    destroy() { for (const c of sprites.values()) c.width = 0; sprites.clear(); signs = []; },
  };
  let lookRef = null;
  const LK_ = () => lookRef || { holiday: null };
  const tick0 = api.tick;
  api.tick = (t, dt, o) => { lookRef = o.L; tick0(t, dt, o); };
  return api;
}
