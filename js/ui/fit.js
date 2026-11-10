// THE NAME NEVER CUTS OFF (THE VAULT 1B — the owner's membership card showed "LOEWFIZZ…" for LOEWFIZZLE): a player's name is shown WHOLE,
// always — never an ellipsis. fitName(el, { min }) sizes the text to its box: the CSS size first; too wide → shrunk to fit (never below
// a readable minimum); still too wide at the minimum → TWO BALANCED LINES (the name split in the middle — WWWWWW / WWWWWW, never eleven
// + one), sized so the longer half fits. Measured when the fonts are in + again only when the box itself changes width (a
// ResizeObserver — never a layout read in a frame loop). NAME_MAX is 12: the widest twelve (WWWWWWWWWWWW) is checked at 390 on the
// card, the strips + the podium (the profile E2E). The name must be the element's FIRST child (a text node); a badge after it stays.
// Works on any element whose parent gives it its width (a flex child needs min-width: 0).
const fitted = new WeakMap();
const fits = new WeakMap();   // (THE CARD PASS: each fitted element's fit — refit(el) runs it again when its box was capped from outside)
/** fit an already-fitted element again now (its container's width changed by a script — e.g. a full card's plate capped off the hero) */
export function refit(el) { const f = el && fits.get(el); if (f) f(); }
// THE SPEED PASS — A FONT THAT ARRIVES LATE (LOBBY FIXES' cloud red: 2 of 42 glowing names overflowing in the lab's GLOWS — "a font-timing
// flake"): `document.fonts.ready` only waits for the fonts ALREADY loading; a name whose face starts loading after it resolved was fitted on
// the fallback face, and nothing fitted it again when the real one landed (the box's width doesn't change → no ResizeObserver). Every fitted
// element re-fits once more when ANY font finishes loading (one listener; a disconnected element drops out)
// PFIX-A (FABLE REVIEW PRISM finding 3 — THE RETAINER): the list holds each fit WEAKLY. It held the closures themselves (each one holds its
// element) until a font next finished loading — after the first minute none ever does — so every podium's names pinned their whole screen
// (PRISM's board canvases, ~12 MB a match). A fit lives exactly as long as its element (the `fits` WeakMap: element → fit); the list never
// keeps one alive. Nothing else changes: a connected element still re-fits on a late font.
const live = new Set();
let lateOn = false;
const weak = fn => (typeof WeakRef === 'function' ? new WeakRef(fn) : { deref: () => fn });
const anchors = new WeakMap();   // element → its late-font fit (the fit lives as long as its element, never longer)
/** re-run `fit` when a font finishes loading, while `el` lives (el: the element the fit sizes — it keeps the fit alive) */
export function onFontsLoaded(fit, el = null) {
  if (el) anchors.set(el, fit);
  if (live.size >= 256) for (const r of [...live]) if (!r.deref()) live.delete(r);   // (the refs of collected fits go too — the list stays small)
  live.add(weak(fit));
  if (lateOn || typeof document === 'undefined' || !document.fonts || !document.fonts.addEventListener) return;
  lateOn = true;
  document.fonts.addEventListener('loadingdone', () => { for (const r of [...live]) { const f = r.deref(); if (!f || f() === false) live.delete(r); } });
}
/** (tests) how many fits the late-font list still names */
export const lateFits = () => live.size;

/** fit one element's text; o.min = the smallest one-line font size (px), o.two = the largest two-line size (px; default 80 % of the CSS size) */
export function fitName(el, o = {}) {
  if (!el || typeof window === 'undefined') return el;
  const first = el.firstChild && el.firstChild.nodeType === 3 ? el.firstChild : null;
  const text = first ? first.nodeValue : null;
  let split = null, was = false;
  const unsplit = () => { if (split) { split.replaceWith(first); split = null; } };
  const fit = () => {
    if (!el.isConnected) return was ? false : undefined;   // (gone after being shown → out of the late-font list; not attached yet → kept)
    was = true;
    // (THE VAULT 2A: a NAME GLOW's little pieces — absolutely placed <i>s after the text — are out of the measure: they'd count as width)
    const deco = [...el.children].filter(c => c.tagName === 'I');
    for (const d of deco) d.style.display = 'none';
    try { fitNow(); } finally { for (const d of deco) d.style.display = ''; }
  };
  const fitNow = () => {
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
  fits.set(el, fit);
  const prev = fitted.get(el); if (prev) prev.disconnect();
  if (typeof ResizeObserver !== 'undefined') { let w = -1; const ro = new ResizeObserver(es => { const nw = Math.round(es[0].contentRect.width); if (nw !== w) { w = nw; fit(); } }); ro.observe(el); fitted.set(el, ro); }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit); else fit();
  onFontsLoaded(fit, el);
  requestAnimationFrame(fit);
  return el;
}
