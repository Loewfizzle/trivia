// OVERCLOCK — US UNITS ON SCREEN (OC6 — the owner's decision 2: US-FIRST). PURE (the server + the build script import it).
// The pools store METRIC (data/oc/*.json: what Wikidata + the sources say); a value is converted + rounded only for DISPLAY, so one data set
// serves both. Units in the data: m · km · km2 · kg · kmh · c (°C) · people · year · '' (a plain count) — any other string is shown as is
// ('players', 'Oscars' …). Rounding: whole numbers up to 100,000, three significant figures above (269,000 sq mi), then "million" /
// "billion" words; under 10 one decimal (1.7 mi), under 1 two significant figures (0.17 sq mi) — never "1,640.42 ft".

export const US_UNITS = Object.freeze({
  m: ['ft', 3.280839895],
  km: ['mi', 0.621371192],
  km2: ['sq mi', 0.386102159],
  kg: ['lb', 2.204622622],
  kmh: ['mph', 0.621371192],
  c: ['°F', null],
});
/** the metric units the data may carry (→ a US unit on screen) + the plain ones */
export const DATA_UNITS = Object.freeze([...Object.keys(US_UNITS), 'people', 'year', '']);

const commas = n => Math.round(n).toLocaleString('en-US');
const sig = (x, n) => { if (x === 0) return 0; const p = Math.pow(10, n - Math.ceil(Math.log10(Math.abs(x)))); return Math.round(x * p) / p; };
const trim = s => s.replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');

/** a positive number as people read it: 2,717 · 269,000 · 39.5 million · 1.4 billion · 1.7 · 0.17 */
export function niceNumber(x) {
  const a = Math.abs(x), sgn = x < 0 ? '-' : '';
  if (a >= 1e9) return `${sgn}${trim((sig(a / 1e9, 3)).toFixed(2))} billion`;
  if (a >= 1e6) { const m = a / 1e6; return `${sgn}${m >= 100 ? commas(m) : trim(sig(m, m >= 10 ? 3 : 2).toFixed(m >= 10 ? 1 : 2))} million`; }
  if (a >= 1e5) return `${sgn}${commas(sig(a, 3))}`;
  if (a >= 10) return `${sgn}${commas(a)}`;
  if (a >= 1) return `${sgn}${trim(a.toFixed(1))}`;
  return `${sgn}${trim(String(sig(a, 2)))}`;
}

/** a year as text: 1876 · 2560 BC (a negative year) */
export const yearText = v => (v < 0 ? `${-v} BC` : String(v));

/** a data value in US units: { n: the converted number, u: its unit label } */
export function usValue(unit, v) {
  const c = US_UNITS[unit];
  if (!c) return { n: v, u: unit === 'people' || unit === 'year' ? '' : unit || '' };
  if (unit === 'c') return { n: Math.round((v * 9) / 5 + 32), u: c[0] };
  return { n: v * c[1], u: c[0] };
}

/** the value as the screen shows it: "2,717 ft", "4,132 mi", "6.6 million sq mi", "39.5 million", "1876", "−38 °F" */
export function showUS(unit, v) {
  if (unit === 'year') return yearText(v);
  const { n, u } = usValue(unit, v);
  if (unit === 'c') return `${n < 0 ? '−' : ''}${Math.abs(n).toLocaleString('en-US')} ${u}`;
  const t = niceNumber(n);
  return u ? `${t} ${u}` : t;
}
