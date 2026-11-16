// THE DAILY KIT — THE SHARE CARD's frame (DM1 — FABLE REVIEW #1, 10): every daily's card is 1080 × 1350 in the look on screen — the ground
// (a gradient), the day look's sun, THE FOOT (ONE straight neon line + NEONSPEAKEASY.COM in plain neon lettering — no frame, no pill: `shareAddress`,
// every share card's — SHARE TODAY, each daily's own card, SHARE YOUR RUN) — and leaves through ONE sender: the image with the line through the
// phone's share sheet; no file sharing → the line shared (or copied) + the image saved. A game draws only its own middle (its doors, its
// searchlights, its clouds / night glow). Lazy: a game's share.js imports this on the first SHARE.
// PFIX-3 (FABLE REVIEW 2): LETTER-SPACING BY HAND where the canvas has none (S10 — `spacedText` / `spacedWidth`: every share card's
// tracked lettering goes through them) · THE CARD IS BUILT BEFORE THE TAP (S11 — `prepShare`: the image + its file are ready when the screen
// opens, so the tap calls the share sheet AT ONCE; a phone that can't share a file — or refuses — is SHOWN the card in a sheet, PRESS AND HOLD
// TO SAVE: never a silent download).
import { lazyImport } from '../ui/lazy-import.js';
import { gameRow } from '../config.js';
export const SHARE_W = 1080, SHARE_H = 1350;
export const SITE = 'neonspeakeasy.com';

// ---------------------------------------------------------------------------------------------- LETTER-SPACING (ONE helper — S10)
// Canvas `letterSpacing` arrived in Safari 18.4: an older iPhone drew every card with NO tracking (the names shrank ~20 % and sat 4–8 px right
// of centre — every caller shifts x by half a gap for the canvas's trailing space). Where the property is missing the text is drawn LETTER BY
// LETTER with the same gap after each (the trailing one too — so the same x centres it exactly as the canvas would).
let manualSpacing = false;
/** the tests / the same-pixels page: draw by hand even where the canvas could (what an older iPhone does) */
export const forceManualSpacing = on => { manualSpacing = !!on; };
const tracks = c => !manualSpacing && 'letterSpacing' in c;
/** the width `t` prints at in the context's font with `ls` px after every letter */
export function spacedWidth(c, t, ls = 0) {
  const str = String(t == null ? '' : t);
  if (tracks(c)) { c.letterSpacing = `${ls}px`; return c.measureText(str).width; }
  return c.measureText(str).width + ls * [...str].length;
}
/** `t` at (x, y) in the context's font / align / fill (or stroke), `ls` px after every letter */
export function spacedText(c, t, x, y, ls = 0, { stroke = false, maxW = 0 } = {}) {
  const str = String(t == null ? '' : t);
  const put = (txt, px) => (stroke ? c.strokeText(txt, px, y) : maxW ? c.fillText(txt, px, y, maxW) : c.fillText(txt, px, y));
  if (tracks(c)) { c.letterSpacing = `${ls}px`; put(str, x); return; }
  if (!ls) { put(str, x); return; }
  const chars = [...str], ws = chars.map(ch => c.measureText(ch).width), total = ws.reduce((a, b) => a + b, 0) + ls * chars.length;
  const al = c.textAlign, k = maxW && total > maxW ? maxW / total : 1;
  let px = al === 'center' ? x - (total * k) / 2 : al === 'right' || al === 'end' ? x - total * k : x;
  c.save(); c.textAlign = 'left';
  chars.forEach((ch, i) => { stroke ? c.strokeText(ch, px, y) : k < 1 ? c.fillText(ch, px, y, ws[i] * k) : c.fillText(ch, px, y); px += (ws[i] + ls) * k; });
  c.restore();
}

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
 * lose (THE DROP). No win word, no name-swap, no extra word for a lost run · (2) ONE big SCORE = THE DAILY's MAIN MEASURE (FIXES R3, the
 * owner Nov 15 — its DAILIES row's `measure`, measureOf below): THE PASSWORD its GUESSES (8 GUESSES), COAST CLEAR + THE DROP their TIME (2:12 ·
 * 2:38.9) — the same size for all, white · (3) ONE stat line, grey (THE PASSWORD's time · 1 SPOTTED · +30 s · 101 LINES) · (4) ONE art strip (THE PASSWORD's tiles — no doors · COAST
 * CLEAR's 3 lamps · THE DROP's board, its top 8 rows) — the SAME sizes and spacing in every section, centred inside ONE column (COL each side
 * of a 1080 card). The three text pieces are drawn by ONE painter each (paintName · paintBig · paintStat — below), never by a daily's own.
 * A section's natural box = H tall (share-today.js scales every section by the same factor); every y is a text MIDDLE; the strip =
 * [artY, artY + artH]. PFIX-3 (Ben, Nov 14): the ART STRIP's HEIGHT IS EACH DAILY's OWN — a daily may export `sectionH` + its `STRIP_H`:
 * THE DROP's board is TALLER (a decent-sized box), COAST CLEAR's lamps SHORTER (they gave up the room), THE PASSWORD's the rhythm's
 * (grown for a tall grid). The name, the big time and the stat line stay the SAME sizes in every section.
 */
/** FIXES R3 — THE ONE RULE's big score: a daily's MAIN MEASURE ('guesses' | 'time') from its DAILIES row (config.js) — 'time' when it names none */
export const MEASURES = Object.freeze(['time', 'guesses']);
export const measureOf = id => { const m = gameRow(id) && gameRow(id).measure; return MEASURES.includes(m) ? m : 'time'; };
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
  const set = () => { c.font = `900 ${p}px ${FONT_NAME}`; };
  set();
  while (fitW && p > 20 && spacedWidth(c, t, p * 0.22) > fitW) { p -= 2; set(); }
  const x = cx + p * 0.11, ls = p * 0.22;
  if (look !== 'day') {
    // (a MODEST glow: one soft pass in the colour, then the core — the colour lifted toward white so the letters stay crisp)
    c.globalAlpha = result ? 0.8 : 0.9; c.shadowColor = result ? col : 'rgba(186,206,255,0.9)'; c.shadowBlur = p * (result ? 0.42 : 0.55); c.fillStyle = col; spacedText(c, t, x, y, ls);
    c.globalAlpha = 1; c.shadowBlur = p * 0.12; c.fillStyle = result ? toward(col, 0.3) : col; spacedText(c, t, x, y, ls);
  } else { c.fillStyle = col; spacedText(c, t, x, y, ls); }
  c.restore();
}
/** (2) THE BIG SCORE (the daily's main measure — a time, or THE PASSWORD's guesses) — the number font's bold, the ink (white by night),
 *  centred on cx; fitW = the widest it may print (a long word line shrinks to it — FIXES R3) */
export function paintBig(c, look, text, cx, y, px, fitW = 0) {
  const t = String(text == null ? '' : text);
  c.save(); c.textAlign = 'center'; c.textBaseline = 'middle';
  let p = px;
  const set = () => { c.font = `700 ${p}px ${FONT_TEXT}`; };
  set();
  while (fitW && p > 24 && c.measureText(t).width > fitW) { p -= 2; set(); }
  c.fillStyle = inkOf(look).ink; c.fillText(t, cx, y);
  c.restore();
}
/** (3) THE STAT LINE — ONE grey line, centred on cx (never a coloured word: a lost run is said by the NAME's red); fitW = the widest it may print */
export function paintStat(c, look, text, cx, y, px, fitW = 0) {
  const t = String(text == null ? '' : text);
  c.save(); c.textAlign = 'center'; c.textBaseline = 'middle';
  let p = px;
  const set = () => { c.font = `700 ${p}px ${FONT_TEXT}`; };
  set();
  while (fitW && p > 16 && spacedWidth(c, t, p * 0.125) > fitW) { p -= 1; set(); }
  c.fillStyle = inkOf(look).stat; spacedText(c, t, cx + p * 0.0625, y, p * 0.125);
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
  let fs = 52, ls = 7; c.font = `800 ${fs}px "Chakra Petch", system-ui, sans-serif`;
  while (spacedWidth(c, ADDR, ls) > W - 220 && fs > 34) { fs -= 2; ls = Math.max(4, ls - 0.3); c.font = `800 ${fs}px "Chakra Petch", system-ui, sans-serif`; }
  const cx = W / 2 + ls / 2;
  if (night) {
    c.shadowColor = glow; c.shadowBlur = 30; c.fillStyle = color; spacedText(c, ADDR, cx, y, ls);
    c.shadowBlur = 7; c.fillStyle = '#fff3fb'; spacedText(c, ADDR, cx, y, ls);
  } else { c.fillStyle = '#10234a'; spacedText(c, ADDR, cx, y, ls); }
  c.restore();
}
/** a daily's OWN card's foot: its day number, small + dim ("Nº 12" — the name is on the card ONCE, at the top; THE DROP: its date — `note`),
 *  over THE FOOT */
export function shareFoot(c, { dayNo = null, note = null, dim, color, site = SITE, W = SHARE_W, look = 'night' }) {
  const small = note != null && note !== '' ? String(note) : dayNo != null ? `Nº ${dayNo}` : '';
  if (small) { c.save(); c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = '700 30px "Chakra Petch", system-ui, sans-serif'; c.fillStyle = dim; spacedText(c, small, W / 2 + 3, FOOT.lineY - 36, 6); c.restore(); }
  shareAddress(c, look, { W, color, site });
}

const blobOf = cv => new Promise(res => { try { cv.toBlob(b => res(b), 'image/png'); } catch { res(null); } });
/** a card's PNG as a file the share sheet takes → { blob, file } | null */
export async function shareFile(cv, name) {
  const blob = cv ? await blobOf(cv) : null;
  if (!blob) return null;
  let file = null;
  try { file = new File([blob], name, { type: 'image/png' }); } catch { /* an old WebView: no File */ }
  return { blob, file };
}
const canShareLink = url => { try { return !!(url && navigator.share && (!navigator.canShare || navigator.canShare({ url }))); } catch { return false; } };
const canShareFile = file => { try { return !!(file && navigator.share && navigator.canShare && navigator.canShare({ files: [file] })); } catch { return false; } };
/**
 * SEND A READY CARD (PFIX-3 — S11): the share sheet with the image + the line, called with NOTHING awaited before it (the file is ready —
 * `prepShare`): Safari refuses a share that comes too long after the tap. No file sharing on this phone (a desktop, plain http), or the
 * sheet refused → THE CARD IS SHOWN in a sheet — PRESS AND HOLD TO SAVE (+ a SHARE tube where the phone can share: a fresh tap). Never a
 * silent download prompt, never nothing.
 * → 'shared' | 'none' (the player closed the share sheet) | 'shown' | 'failed'
 */
export async function sendReady({ blob, file, line = '', url = '' } = {}) {
  if (!blob) return 'failed';
  // (CITY E — THE TAPPABLE SHARE CARD: the card's picture is on the server — the LINK goes out, its preview IS the card. FIXES R1 — THE OWNER:
  //  the LINK ONLY, no text in the message. No link (the upload failed) → the image + the line as before)
  if (url && canShareLink(url)) {
    try { shareHold(); await navigator.share({ url }); return 'shared'; }
    catch (e) { if (e && e.name === 'AbortError') return 'none'; /* refused → the image path below */ }
    finally { shareHold(); }
  }
  const can = canShareFile(file);
  if (can) {
    try { shareHold(); await navigator.share({ files: [file], text: line }); return 'shared'; }
    catch (e) { if (e && e.name === 'AbortError') return 'none'; /* refused (too long after the tap · not allowed here) → shown */ }
    finally { shareHold(); }
  }
  return showCard({ blob, file, line, can });
}
/** FIXES R1 — THE SHARE HOLD: the share sheet (and the app it hands the link to — Messages, Mail…) is not "the player came back" — the queued
 *  catch-up reload (ui/lazy-import.js#reloadAtReturn — ONE DEPLOY AT A TIME) waits 60 s past a share's start AND its end; it reads this hub
 *  (a lazy chunk never imports a boot module for a new export — THE STALE-MODULE RULE) */
export const shareHold = () => { try { globalThis.__nsShareAt = Date.now(); } catch { /* fine */ } };
/** the card in THE SHEET: the picture (press and hold saves it on a phone), ONE line under it, a SHARE tube where a file can be shared — and
 *  nothing over the card (no message) → 'shown' */
export async function showCard({ blob, file = null, line = '', can = false } = {}) {
  try {
    const [{ openSheet }, { h }, { tubeButton }] = await Promise.all([lazyImport(import('../ui/sheet.js'), '../ui/sheet.js'),
      lazyImport(import('../ui/dom.js'), '../ui/dom.js'), lazyImport(import('../ui/components.js'), '../ui/components.js')]);
    const url = URL.createObjectURL(blob);
    const img = h('img.shr-img', { src: url, alt: 'Your share card', draggable: 'false' });
    let busy = false;
    const again = can ? tubeButton('SHARE', { kind: 'main', block: true, cls: 'shr-go', attrs: { 'data-gesture': true }, onClick: async () => {
      if (busy) return; busy = true;
      try { shareHold(); await navigator.share({ files: [file], text: line }); S.close(); } catch { /* closed / refused: the picture stays */ } finally { busy = false; shareHold(); }
    } }) : null;
    const S = openSheet({ title: 'YOUR CARD', cls: 'shr-sheet', label: 'Your share card', body: [img, h('p.shr-hold', 'PRESS AND HOLD TO SAVE'), again], onClose: () => setTimeout(() => URL.revokeObjectURL(url), 1500) });
    // (THE ADD-ON, Nov 14 4:14 pm: NO message over this sheet — it covered the card and repeated the line under it; the sheet IS the answer)
    void S;
    return 'shown';
  } catch (e) { console.warn('[share] show', e); return 'failed'; }
}
/** the cards' lettering is IN before a card is drawn (a canvas draws a font only once it is loaded — a card built as a screen opens could
 *  come before a weight the screen itself never used: it then printed in the system's font). ≤ 2.5 s, never a failure. */
export const SHARE_FONTS = Object.freeze(['900 72px "Orbitron"', '700 84px "Chakra Petch"', '800 52px "Chakra Petch"']);
export async function shareFonts() {
  try {
    if (typeof document === 'undefined' || !document.fonts || !document.fonts.load) return;
    await Promise.race([Promise.all(SHARE_FONTS.map(f => document.fonts.load(f).catch(() => null))), new Promise(r => setTimeout(r, 2500))]);
  } catch { /* the card draws in what it has */ }
}
/**
 * PFIX-3 — S11, THE CARD IS BUILT BEFORE THE TAP: `make()` (async → { cv, name, line } — its imports, an /api call, the drawing) runs when
 * the screen OPENS (`warm()`), the PNG + its file are kept, the canvas freed; the tap (`send()`) then reaches the share sheet with nothing
 * left to wait for. ONE send at a time (a double tap = 'busy'). A build that failed is tried again by the next warm / send.
 */
export function prepShare(make) {
  let p = null, busy = false;
  const build = () => (p ||= shareFonts().then(make).then(async o => {
    if (!o || !o.cv) return null;
    // (CITY E — THE TAPPABLE SHARE CARD: `o.upload(png)` → the link (an absolute URL) — the half-size PNG sent NOW, while the screen opens,
    //  never at the tap; a failed upload = no link: the share still goes out as the image + the line)
    const linkP = o.upload ? halfPng(o.cv).then(b => (b ? o.upload(b) : '')).catch(e => { console.warn('[share] upload', e); return ''; }) : Promise.resolve('');
    const f = await shareFile(o.cv, o.name || 'neon-speakeasy.png');
    const url = await linkP;
    try { o.cv.width = o.cv.height = 0; } catch { /* fine */ }               // (5.8 MB a card — freed at once: only the PNG is kept)
    return f ? { ...f, line: o.line || '', url: url || '' } : null;
  }).catch(e => { console.warn('[share] build', e); return null; }).then(r => { if (!r) p = null; return r; }));
  return {
    warm() { build(); },
    ready: () => build().then(r => !!r),
    async send() {
      if (busy) return 'busy';
      busy = true;
      try { const r = await build(); return r ? await sendReady(r) : 'failed'; } finally { busy = false; }
    },
  };
}
/** CITY E — the card at EXACTLY half its size (540 × 675 — the link preview's picture; api/_lib/share-card.js checks the size) as a PNG blob */
export const LINK_W = SHARE_W / 2, LINK_H = SHARE_H / 2;
export async function halfPng(cv) {
  try {
    const h = document.createElement('canvas'); h.width = LINK_W; h.height = LINK_H;
    const c = h.getContext('2d'); c.imageSmoothingQuality = 'high'; c.drawImage(cv, 0, 0, LINK_W, LINK_H);
    const b = await blobOf(h);
    h.width = h.height = 0;
    return b;
  } catch { return null; }
}
/** FIXES R1 (THE REVIEW A4) — A CARD UPLOADS ONCE: the picture's fingerprint (SHA-256 where the page is secure, else FNV-1a over the bytes —
 *  a LAN preview on plain http) → a short string. The phone remembers { pid, day, h, url } (localStorage ns:shr — ONE entry, the latest day):
 *  the same card again (a reload, the screen reopened) shares the remembered link, nothing uploaded; a CHANGED card uploads (the server keeps
 *  that day's code — the link already sent keeps working) */
export async function blobHash(blob) {
  const buf = new Uint8Array(await blob.arrayBuffer());
  try { if (globalThis.crypto && crypto.subtle && globalThis.isSecureContext) return [...new Uint8Array(await crypto.subtle.digest('SHA-256', buf))].slice(0, 12).map(b => b.toString(16).padStart(2, '0')).join(''); } catch { /* below */ }
  let h = 0x811c9dc5; for (let i = 0; i < buf.length; i++) { h ^= buf[i]; h = Math.imul(h, 0x01000193) >>> 0; }
  return `f${h.toString(16)}${buf.length.toString(16)}`;
}
export const SHARE_LINK_KEY = 'ns:shr';
/** PURE: the remembered link for this card, or '' (another player · another day · another picture) */
export const rememberedLink = (kept, { pid, day, h }) => (kept && kept.pid === pid && kept.day === day && kept.h === h && typeof kept.url === 'string' ? kept.url : '');
export function keptLink() { try { return JSON.parse(localStorage.getItem(SHARE_LINK_KEY) || 'null'); } catch { return null; } }
export function keepLink(v) { try { localStorage.setItem(SHARE_LINK_KEY, JSON.stringify(v)); } catch { /* private mode: it uploads again next time */ } }
/** a blob → its base64 (no data: prefix) */
export const base64Of = blob => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result).replace(/^data:[^,]*,/, '')); r.onerror = () => rej(r.error); r.readAsDataURL(blob); });
/** SHARE a card drawn at the tap (SHARE YOUR RUN's podium card — small, drawn in one frame): the same sender → 'shared' | 'none' | 'shown' | 'failed' */
export async function sendShare(cv, { file: name, line }) {
  const f = await shareFile(cv, name);
  return f ? sendReady({ ...f, line }) : 'failed';
}
