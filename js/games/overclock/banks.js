// OVERCLOCK content banks — every pool is BUILT by scripts/oc-pools/build.mjs (docs/content.md "THE POOL BUILD") and fetched once, only when
// a match's order actually includes that challenge (the host's start() + every phone's view at mount — never preload()). OC6: TRUE OR FALSE,
// TIMELINE, SORT IT, HIGHER OR LOWER. OC7: TRIVIA LIGHTNING's OWN bank (data/oc/trivia.json — no live Trivia API for OVERCLOCK), CLOSEST CALL,
// MISSING LINK, SPELLCHECK. THE DAILY RESERVE is server-only and never loaded here (docs/cartridge.md D2).
const FILES = {
  trivia: ['trivia.json', 'items'],
  truefalse: ['truefalse.json', 'items'],
  timeline: ['timeline.json', 'themes'],
  closest: ['closest.json', 'questions'],
  missinglink: ['missinglink.json', 'puzzles'],
  spellcheck: ['spellcheck.json', 'words'],
  sortit: ['sortit.json', 'sets'],
  higherlower: ['higherlower.json', 'stats'],
};
export const BANK_TYPES = Object.keys(FILES);
export const BANK_FILES = Object.freeze(Object.fromEntries(Object.entries(FILES).map(([t, [f, k]]) => [t, { file: f, key: k }])));
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
