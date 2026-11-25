// THE CITY POLISH PASS — THE QUIET KINDS, ONE LIST (the owner's Nov 24 inbox entry: 'not-host', 'slow-boot' + empty rows arrived as TAP rows in
// THE PHONE LOG): every kind of expected noise that is COUNTED (logstats/{kind}), never a row. api/_lib/log-pure.js (the server) and js/errlog.js
// (the phone) both read THIS list — tests/quiet-kinds.test.mjs. PURE, no imports.
export const QUIET_KINDS = Object.freeze(['old', 'gone', 'ext', 'snd', 'slow', 'dead', 'late-proof', 'slow-boot', 'late-vote', 'not-host']);
// (the invisible marks by their code points — no such character is ever typed into this file)
const invisible = c => (c >= 0x200b && c <= 0x200f) || (c >= 0x2028 && c <= 0x202f) || c === 0x2060 || c === 0xfeff;
/** a report's text with something to read (never empty, never only spaces / invisible marks) */
export const visibleText = t => typeof t === 'string' && [...t].some(ch => !/\s/.test(ch) && !invisible(ch.codePointAt(0)));
