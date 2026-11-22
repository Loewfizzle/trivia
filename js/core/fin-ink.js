// CITY F — END-SCREEN STANDARD A: the end screen's BAR is solid in the GAME's accent (ui/final.js) — its words dark where they read
// The long notes: docs/games/jaywalk-notes.md
export const FIN_DARK = '#0b0a14';
const lin = c => { const v = c / 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
/** a #rrggbb colour's relative luminance */
export function lum(hex) { const n = parseInt(String(hex).replace('#', ''), 16); return 0.2126 * lin(n >> 16 & 255) + 0.7152 * lin(n >> 8 & 255) + 0.0722 * lin(n & 255); }
/** the contrast ratio of two #rrggbb colours (1 – 21) */
export function contrast(a, b) { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
/** the bar's text colour on `accent`: FIN_DARK when it reads ≥ 4.5 : 1, else white */
export function finInk(accent) { return contrast(accent, FIN_DARK) >= 4.5 ? FIN_DARK : '#ffffff'; }
