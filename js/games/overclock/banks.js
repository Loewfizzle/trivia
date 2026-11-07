// OVERCLOCK content banks (TRUE OR FALSE facts, TIMELINE theme pools, CLOSEST CALL questions, MISSING LINK puzzles,
// SPELLCHECK words, SORT IT category pairs, HIGHER OR LOWER stats), fetched once — only when a match's order actually
// includes that challenge (OC6: the big pools are built by scripts/oc-pools/build.mjs — docs/content.md; the DAILY RESERVE is
// never here: api/_data/oc-reserve/, server-only).
const FILES = {
  truefalse: ['truefalse.json', 'items'],
  timeline: ['timeline.json', 'themes'],
  closest: ['closest.json', 'questions'],
  missinglink: ['missinglink.json', 'puzzles'],
  spellcheck: ['spellcheck.json', 'words'],
  sortit: ['sortit.json', 'sets'],
  higherlower: ['higherlower.json', 'stats'],
};
export const BANK_TYPES = Object.keys(FILES);
const cache = {};
const pending = {};

export const bankFor = type => cache[type] || null;

export function loadBank(type) {
  if (cache[type]) return Promise.resolve(cache[type]);
  if (pending[type]) return pending[type];
  const [file, key] = FILES[type];
  pending[type] = fetch(new URL(`../../../data/oc/${file}`, import.meta.url))
    .then(r => { if (!r.ok) throw new Error(`${file} ${r.status}`); return r.json(); })
    .then(d => { cache[type] = key ? d[key] : d; return cache[type]; })
    .catch(e => { pending[type] = null; throw e; });
  return pending[type];
}

/** Starts fetching every bank this order needs. */
export const preloadFor = order => Promise.all(BANK_TYPES.filter(t => order.includes(t)).map(t => loadBank(t).catch(() => null)));
