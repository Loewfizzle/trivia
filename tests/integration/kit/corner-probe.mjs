// HOLD'EM IN THE CITY — B2: THE CORNER BUTTONS' REAL HIT AREA (HE9's Fable review: ☰ + the music button's tap area was 42 × 42 — the ::after
// inset is measured from the PADDING box, inside the 1 pt border). Measured the way a finger meets it: elementFromPoint along the lines through
// each button's centre, a quarter point at a time → the span that still hits the button (or something inside it). Used by the harbor
// `corners` group (harbor-e2e/lobby.mjs) on the city, THE BOARD, the games and the dailies at 390 + 1440.
export const CORNER_SEL = ['.menu-btn', '.music-btn', '.bd-back', '.pf-back', '.dy-back'];

/** run IN THE PAGE (page.evaluate(PROBE, sels)) → [{ sel, w, h, box }] for every visible corner button */
export const PROBE = sels => {
  const out = [], STEP = 0.25, MAX = 40;
  for (const sel of sels) for (const el of document.querySelectorAll(sel)) {
    const r = el.getBoundingClientRect(), cs = getComputedStyle(el);
    if (!r.width || !r.height || cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) === 0) continue;
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const hits = (x, y) => { const e = document.elementFromPoint(x, y); return !!e && (e === el || el.contains(e)); };
    if (!hits(cx, cy)) { out.push({ sel, w: 0, h: 0, box: [r.width, r.height], covered: true }); continue; }
    const reach = (dx, dy) => { let d = 0; while (d < MAX && hits(cx + dx * (d + STEP), cy + dy * (d + STEP))) d += STEP; return d; };
    // (whole points: the hit edge lies within a quarter point of the last hit — 44 reads 44, the old 42 reads 42)
    out.push({ sel, w: Math.floor(reach(-1, 0) + reach(1, 0) + STEP), h: Math.floor(reach(0, -1) + reach(0, 1) + STEP), box: [Math.round(r.width), Math.round(r.height)] });
  }
  return out;
};
