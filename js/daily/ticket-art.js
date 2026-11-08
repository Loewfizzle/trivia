// THE DAILY MODULE — THE TICKET's DRAWN PIECES (DFIX3 — THE PREMIUM TICKET; docs/progression.md "DFIX3"). Shared by THE DAILY SCREEN's ticket
// rows (js/screens/daily.js) and SHARE TODAY's image (js/daily/share-today.js) so the two draw the SAME ticket: a daily's neon art by its
// `ticket` key, the ADMITTED rubber stamp (drawn — a rounded double border + the word, an uneven ink edge from a displacement filter; never a
// glyph, never an emoji), the serial "Nº MMDD" (today's date — the ticket's own number, never a profile number). No pills anywhere.
const tube = (d, vb = '0 0 24 24') => `<svg viewBox="${vb}" aria-hidden="true"><g class="t">${d}</g><g class="c">${d}</g></svg>`;
/** a ticket's art by its key (config.js#DAILIES `ticket`): THE PASSWORD's door + keyhole · COAST CLEAR's lighthouse + beam · a star */
export const TICKET_ART = {
  password: tube('<path d="M6.6 20.6V4.6c0-.6.5-1.1 1.1-1.1h8.6c.6 0 1.1.5 1.1 1.1v16"/><circle cx="12" cy="10.6" r="1.6"/><path d="M12 12.2v3"/><path d="M4 20.6h16"/>'),
  coastclear: tube('<path d="M9.6 20.6l1.1-10.4h2.6l1.1 10.4"/><path d="M10 10.2h4M10.5 7.7h3l-.3-2.6h-2.4z"/><path d="M14.6 6.1l5.6-2.2M14.6 7.6l5.8 1"/><path d="M3.6 20.6c2.2-1.3 4.4-1.3 6.6 0s4.4 1.3 6.6 0 2.4-1 3.6-.6"/>'),
  star: tube('<path d="M12 3.6l2.5 5.3 5.8.7-4.3 4 1.1 5.7L12 16.5l-5.1 2.8 1.1-5.7-4.3-4 5.8-.7z"/>'),
};
/** the art's PATHS alone (the share image draws them on its canvas through an SVG image) */
export const TICKET_PATHS = Object.fromEntries(Object.entries(TICKET_ART).map(([k, v]) => [k, /<g class="t">(.*?)<\/g>/.exec(v)[1]]));

export const STAMP_WORD = 'ADMITTED';
let stampN = 0;
/**
 * THE ADMITTED STAMP (drawn): a 120 × 44 box — a rounded double border + the word, in `currentColor` (the daily's ink); the ink edge made uneven
 * by a tiny displacement of fractal noise (a static filter on a small element — never animated). The stamp is TILTED by its CSS (−8°).
 */
export function stampSvg(word = STAMP_WORD) {
  const id = `dy-stamp-f${++stampN}`;
  return `<svg viewBox="0 0 120 44" aria-hidden="true" class="dy-stamp-svg">`
    + `<filter id="${id}" x="-4%" y="-8%" width="108%" height="116%"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="1.6" xChannelSelector="R" yChannelSelector="G"/></filter>`
    + `<g filter="url(#${id})" fill="none" stroke="currentColor" stroke-linejoin="round">`
    + `<rect x="2.5" y="2.5" width="115" height="39" rx="9" stroke-width="3"/>`
    + `<rect x="8" y="8" width="104" height="28" rx="5.5" stroke-width="1.5" opacity="0.9"/>`
    + `<text x="60" y="27.6" text-anchor="middle" fill="currentColor" stroke="none" font-family="'Chakra Petch', system-ui, sans-serif" font-weight="800" font-size="14.5" letter-spacing="2.2">${word}</text>`
    + `</g></svg>`;
}
/** the serial: "Nº 1108" — the day key's MMDD (d20261108 → 1108); a date when there is no key */
export function serialOf(dayKey, now = Date.now()) {
  const m = /^d\d{4}(\d{2})(\d{2})$/.exec(String(dayKey || ''));
  if (m) return `Nº ${m[1]}${m[2]}`;
  const d = new Date(now);
  return `Nº ${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
}
/** the date line: "SUN NOV 8" from a day key (its own calendar day — never the phone's zone) */
export function dateLineOf(dayKey, now = Date.now()) {
  const m = /^d(\d{4})(\d{2})(\d{2})$/.exec(String(dayKey || ''));
  const d = m ? new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], 12)) : new Date(now);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', ...(m ? { timeZone: 'UTC' } : {}) }).replace(',', '').toUpperCase();
}
