// OVERCLOCK content banks (LEXICON letter sets, TIMELINE sets, CLOSEST CALL questions), fetched once —
// only when a match's order actually includes that challenge.
const FILES = { lexicon: ['lexicon.json', 'sets'], timeline: ['timeline.json', 'sets'], closest: ['closest.json', 'questions'] };
const cache = {};
const pending = {};

export const bankFor = type => cache[type] || null;

export function loadBank(type) {
  if (cache[type]) return Promise.resolve(cache[type]);
  if (pending[type]) return pending[type];
  const [file, key] = FILES[type];
  pending[type] = fetch(new URL(`../../../data/oc/${file}`, import.meta.url))
    .then(r => { if (!r.ok) throw new Error(`${file} ${r.status}`); return r.json(); })
    .then(d => { cache[type] = d[key]; return cache[type]; })
    .catch(e => { pending[type] = null; throw e; });
  return pending[type];
}

/** Starts fetching every bank this order needs. */
export const preloadFor = order => Promise.all(Object.keys(FILES).filter(t => order.includes(t)).map(t => loadBank(t).catch(() => null)));
