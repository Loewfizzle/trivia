// THE DAILY KIT — THE SHARE CARD's frame (DM1 — FABLE REVIEW #1, 10): every daily's card is 1080 × 1350 in the look on screen — the ground
// (a gradient), the day look's sun, the day number + the site at the foot — and leaves through ONE sender: the image with the line through the
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
/** the foot: "THE PASSWORD #12" (dim) + the site (the game's colour) */
export function shareFoot(c, { name, dayNo = null, dim, color, site = SITE, W = SHARE_W }) {
  c.font = '700 30px "Chakra Petch", system-ui, sans-serif'; c.fillStyle = dim; c.save(); c.letterSpacing = '6px';
  c.fillText(dayNo != null ? `${name} #${dayNo}` : name, W / 2 + 3, 1190);
  c.fillStyle = color;
  c.fillText(String(site || SITE).toUpperCase(), W / 2 + 3, 1250);
  c.restore();
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
