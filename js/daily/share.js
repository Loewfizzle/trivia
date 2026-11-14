// THE DAILY KIT — THE SHARE CARD's frame (DM1 — FABLE REVIEW #1, 10): every daily's card is 1080 × 1350 in the look on screen — the ground
// (a gradient), the day look's sun, THE FOOT (ONE straight neon line + NEONSPEAKEASY.COM in plain neon lettering — no frame, no pill: `shareAddress`,
// every share card's — SHARE TODAY, each daily's own card, SHARE YOUR RUN) — and leaves through ONE sender: the image with the line through the
// phone's share sheet; no file sharing → the line shared (or copied) + the image saved. A game draws only its own middle (its doors, its
// searchlights, its clouds / night glow). Lazy: a game's share.js imports this on the first SHARE.
export const SHARE_W = 1080, SHARE_H = 1350;
export const SITE = 'neonspeakeasy.com';

/** a fresh card: the ground (L.bg0 → L.bg1) + the day look's sun → { cv, c, W, H } */
export function shareFrame(L, look) {
  const W = SHARE_W, H = SHARE_H;
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const c = cv.getContext('2d');
  const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, L.bg0); g.addColorStop(1, L.bg1); c.fillStyle = g; c.fillRect(0, 0, W, H);
  if (look === 'day') {
    const sun = c.createRadialGradient(150, 120, 0, 150, 120, 320); sun.addColorStop(0, 'rgba(255,250,230,0.95)'); sun.addColorStop(0.4, 'rgba(255,244,200,0.45)'); sun.addColorStop(1, 'rgba(255,244,200,0)'); c.fillStyle = sun; c.fillRect(0, 0, W, H);
  }
  return { cv, c, W, H };
}
/**
 * THE SHARE CARD's ONE RULE (SKINS 2B — the owner, Nov 14, approved from a mockup + his 11:16 am add-on; it replaces SKINS 2A's "the name or
 * the win word"): every SHARE TODAY section = (1) THE NAME — the daily's own name, the SAME small size for all, and IT CARRIES THE RESULT:
 * a clean GREEN neon when the run was made, RED when it failed (a modest glow — never a blazing headline), WHITE for a daily with no win /
 * lose (THE DROP). No win word, no name-swap, no extra word for a lost run · (2) ONE big TIME, the same size for all, white (2:54 · 2:12 ·
 * 2:38.9) · (3) ONE stat line, grey (5 GUESSES · 1 SPOTTED · +30 s · 101 LINES) · (4) ONE art strip (THE PASSWORD's tiles — no doors · COAST
 * CLEAR's 3 lamps · THE DROP's board, its top 8 rows) — the SAME sizes and spacing in every section, centred inside ONE column (COL each side
 * of a 1080 card). The three text pieces are drawn by ONE painter each (paintName · paintBig · paintStat — below), never by a daily's own.
 * A section's natural box = H tall (share-today.js scales every section by the same factor); every y is a text MIDDLE; the strip =
 * [artY, artY + artH].
 */
export const RHYTHM = Object.freeze({ H: 312, COL: 150, nameY: 18, namePx: 40, bigY: 87, bigPx: 84, statY: 141, statPx: 32, artY: 167, artH: 145 });
/** the same rule on a daily's OWN card (1080 × 1350): the name · the big time · the stat line · the art (its box: artY → artBot) · the foot */
export const OWN = Object.freeze({ nameY: 150, namePx: 72, bigY: 378, bigPx: 150, statY: 506, statPx: 46, artY: 590, artBot: 1150 });
/** the three text pieces' colours — the SAME on every daily's card + section: the NAME by its result (`made` green · `failed` red · none =
 *  white; by day the same green / red / navy in the day palette), the big time = the ink (white), the stat line = grey */
export const INK = Object.freeze({
  night: Object.freeze({ name: '#ffffff', made: '#3dff8b', failed: '#ff4a68', ink: '#f4f6ff', stat: '#b6bcd4' }),
  day: Object.freeze({ name: '#16305c', made: '#17703d', failed: '#b02040', ink: '#14284a', stat: '#3a5582' }),
});
export const MADE = 'made', FAILED = 'failed';
const FONT_NAME = '"Orbitron", "Chakra Petch", system-ui, sans-serif', FONT_TEXT = '"Chakra Petch", system-ui, sans-serif';
const inkOf = look => INK[look === 'day' ? 'day' : 'night'];
const toward = (hex, k) => `rgb(${[1, 3, 5].map(i => { const v = parseInt(hex.slice(i, i + 2), 16); return Math.round(v + (255 - v) * k); }).join(',')})`;
/** the name's colour for a result (`MADE` | `FAILED` | null) — the night's green is the page's --good token (the colour-blind swap rides
 *  along; the result is never by colour alone: the art shows it too) */
export function nameInk(look, result = null) {
  const K = inkOf(look);
  let col = result === MADE ? K.made : result === FAILED ? K.failed : K.name;
  if (result === MADE && look !== 'day') { try { const g = getComputedStyle(document.body).getPropertyValue('--good').trim(); if (/^#[0-9a-f]{6}$/i.test(g)) col = g; } catch { /* no DOM tokens */ } }
  return col;
}
/** (1) THE NAME — the daily's own name as small clean neon in its RESULT's colour (a soft glow in the colour under a lighter core; by day
 *  plain ink — no glow), centred on cx; fitW = the widest it may print */
export function paintName(c, look, name, cx, y, px, fitW = 0, result = null) {
  const col = nameInk(look, result), t = String(name || '').toUpperCase();
  c.save(); c.textAlign = 'center'; c.textBaseline = 'middle';
  let p = px;
  const set = () => { c.font = `900 ${p}px ${FONT_NAME}`; c.letterSpacing = `${p * 0.22}px`; };
  set();
  while (fitW && p > 20 && c.measureText(t).width > fitW) { p -= 2; set(); }
  const x = cx + p * 0.11;
  if (look !== 'day') {
    // (a MODEST glow: one soft pass in the colour, then the core — the colour lifted toward white so the letters stay crisp)
    c.globalAlpha = result ? 0.8 : 0.9; c.shadowColor = result ? col : 'rgba(186,206,255,0.9)'; c.shadowBlur = p * (result ? 0.42 : 0.55); c.fillStyle = col; c.fillText(t, x, y);
    c.globalAlpha = 1; c.shadowBlur = p * 0.12; c.fillStyle = result ? toward(col, 0.3) : col; c.fillText(t, x, y);
  } else { c.fillStyle = col; c.fillText(t, x, y); }
  c.restore();
}
/** (2) THE BIG TIME — the number font's bold, the ink (white by night), centred on cx */
export function paintBig(c, look, text, cx, y, px) {
  c.save(); c.textAlign = 'center'; c.textBaseline = 'middle';
  c.font = `700 ${px}px ${FONT_TEXT}`; c.fillStyle = inkOf(look).ink; c.fillText(String(text == null ? '' : text), cx, y);
  c.restore();
}
/** (3) THE STAT LINE — ONE grey line, centred on cx (never a coloured word: a lost run is said by the NAME's red); fitW = the widest it may print */
export function paintStat(c, look, text, cx, y, px, fitW = 0) {
  const t = String(text == null ? '' : text);
  c.save(); c.textAlign = 'center'; c.textBaseline = 'middle';
  let p = px;
  const set = () => { c.font = `700 ${p}px ${FONT_TEXT}`; c.letterSpacing = `${p * 0.125}px`; };
  set();
  while (fitW && p > 16 && c.measureText(t).width > fitW) { p -= 1; set(); }
  c.fillStyle = inkOf(look).stat; c.fillText(t, cx + p * 0.0625, y);
  c.restore();
}

/**
 * THE FOOT — EVERY share card's (SKINS 2A — NO PILLS, EVER: the address's rounded tube frame is gone): ONE straight thin neon line + under it
 * NEONSPEAKEASY.COM in plain neon lettering (the same size + glow as before — it must read in a text thread: a 360-px-wide downscale ≈ 17 px
 * letters). NIGHT: `color` in a soft glow with a white core; DAY: strong dark navy (CITY FIXES' rule). The line spans the card's column.
 */
export const FOOT = Object.freeze({ lineY: 1226, y: 1284 });
export function shareAddress(c, look, { W = SHARE_W, y = FOOT.y, lineY = FOOT.lineY, color = '#ff6fc8', site = SITE, pad = RHYTHM.COL } = {}) {
  const ADDR = String(site || SITE).toUpperCase(), night = look !== 'day';
  const glow = night ? color : 'transparent';
  c.save(); c.textAlign = 'center'; c.textBaseline = 'middle'; c.globalAlpha = 1;
  // the ONE straight line (a thin tube: the colour in a soft glow, a white core — by day a plain navy rule)
  c.lineCap = 'butt';
  c.beginPath(); c.moveTo(pad, lineY); c.lineTo(W - pad, lineY);
  if (night) {
    c.save(); c.shadowColor = glow; c.shadowBlur = 18; c.strokeStyle = color; c.lineWidth = 3.5; c.stroke();
    c.shadowBlur = 4; c.strokeStyle = 'rgba(255,240,250,0.9)'; c.lineWidth = 1.3; c.stroke(); c.restore();
  } else { c.strokeStyle = 'rgba(16,35,74,0.62)'; c.lineWidth = 3; c.stroke(); }
  // the address
  let fs = 52, ls = 7; c.font = `800 ${fs}px "Chakra Petch", system-ui, sans-serif`; c.letterSpacing = `${ls}px`;
  while (c.measureText(ADDR).width > W - 220 && fs > 34) { fs -= 2; ls = Math.max(4, ls - 0.3); c.font = `800 ${fs}px "Chakra Petch", system-ui, sans-serif`; c.letterSpacing = `${ls}px`; }
  const cx = W / 2 + ls / 2;
  if (night) {
    c.shadowColor = glow; c.shadowBlur = 30; c.fillStyle = color; c.fillText(ADDR, cx, y);
    c.shadowBlur = 7; c.fillStyle = '#fff3fb'; c.fillText(ADDR, cx, y);
  } else { c.fillStyle = '#10234a'; c.fillText(ADDR, cx, y); }
  c.restore();
}
/** a daily's OWN card's foot: its day number, small + dim ("Nº 12" — the name is on the card ONCE, at the top), over THE FOOT */
export function shareFoot(c, { dayNo = null, dim, color, site = SITE, W = SHARE_W, look = 'night' }) {
  if (dayNo != null) { c.save(); c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = '700 30px "Chakra Petch", system-ui, sans-serif'; c.letterSpacing = '6px'; c.fillStyle = dim; c.fillText(`Nº ${dayNo}`, W / 2 + 3, FOOT.lineY - 36); c.restore(); }
  shareAddress(c, look, { W, color, site });
}

const blobOf = cv => new Promise(res => cv.toBlob(b => res(b), 'image/png'));
/** SHARE: the image through the share sheet with the line; no file sharing → the line shared (or copied) + the image saved →
 *  'shared' | 'saved' | 'copied' | 'none' */
export async function sendShare(cv, { file: name, line }) {
  const blob = await blobOf(cv);
  const file = blob ? new File([blob], name, { type: 'image/png' }) : null;
  if (file && navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file], text: line }); return 'shared'; } catch (e) { if (e && e.name === 'AbortError') return 'none'; }
  }
  // the fallback: the line, then the image saved
  let how = 'none';
  try { if (navigator.share) { await navigator.share({ text: line }); how = 'shared'; } else { await navigator.clipboard.writeText(line); how = 'copied'; } } catch { /* closed */ }
  if (blob) {
    try {
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.rel = 'noopener';
      document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      how = how === 'none' ? 'saved' : how;
    } catch { /* no download */ }
  }
  return how;
}
