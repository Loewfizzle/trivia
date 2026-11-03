// THE NAME NEVER CUTS OFF (THE VAULT 1B — the owner's membership card showed "LOEWFIZZ…" for LOEWFIZZLE): a player's name is shown WHOLE,
// always — never an ellipsis. fitName(el, { min }) sizes the text to its box: the CSS size first; too wide → shrunk to fit (never below
// a readable minimum); still too wide at the minimum → TWO BALANCED LINES (the name split in the middle — WWWWWW / WWWWWW, never eleven
// + one), sized so the longer half fits. Measured when the fonts are in + again only when the box itself changes width (a
// ResizeObserver — never a layout read in a frame loop). NAME_MAX is 12: the widest twelve (WWWWWWWWWWWW) is checked at 390 on the
// card, the strips + the podium (the profile E2E). The name must be the element's FIRST child (a text node); a badge after it stays.
// Works on any element whose parent gives it its width (a flex child needs min-width: 0).
const fitted = new WeakMap();

/** fit one element's text; o.min = the smallest one-line font size (px), o.two = the largest two-line size (px; default 80 % of the CSS size) */
export function fitName(el, o = {}) {
  if (!el || typeof window === 'undefined') return el;
  const first = el.firstChild && el.firstChild.nodeType === 3 ? el.firstChild : null;
  const text = first ? first.nodeValue : null;
  let split = null;
  const unsplit = () => { if (split) { split.replaceWith(first); split = null; } };
  const fit = () => {
    if (!el.isConnected) return;
    unsplit();
    el.classList.remove('fit-2');
    el.style.fontSize = '';
    const base = parseFloat(getComputedStyle(el).fontSize) || 16, min = Math.min(o.min || 13, base);
    el.style.whiteSpace = 'nowrap';
    const avail = el.clientWidth, need = el.scrollWidth;
    if (!avail || need <= avail + 0.5) { el.style.whiteSpace = ''; return; }
    let size = Math.max(min, Math.floor(base * (avail / need) * 100) / 100 - 0.2);
    el.style.fontSize = `${size}px`;
    if (el.scrollWidth > el.clientWidth + 0.5) {
      // two balanced lines: the name split at its middle (a line break only there), the longer half sized to fit (up to the CSS size)
      if (first && text.length >= 2) {
        const k = Math.ceil(text.length / 2);
        split = document.createElement('span'); split.className = 'fit-split';
        split.append(text.slice(0, k), document.createElement('br'), text.slice(k));
        first.replaceWith(split);
        const top = Math.min(base, o.two || base * 0.8);
        el.style.fontSize = `${top}px`;
        const w = el.scrollWidth;
        size = w > avail ? Math.max(9, Math.floor(top * (avail / w) * 100) / 100 - 0.2) : top;
        el.style.fontSize = `${size}px`;
      }
      el.classList.add('fit-2');
    }
    el.style.whiteSpace = '';
  };
  const prev = fitted.get(el); if (prev) prev.disconnect();
  if (typeof ResizeObserver !== 'undefined') { let w = -1; const ro = new ResizeObserver(es => { const nw = Math.round(es[0].contentRect.width); if (nw !== w) { w = nw; fit(); } }); ro.observe(el); fitted.set(el, ro); }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit); else fit();
  requestAnimationFrame(fit);
  return el;
}
