// Neural Bluff question bank (data/bluff/questions.json). Loaded by the host only;
// the chosen question travels to players obfuscated inside the game state.
import { qHash } from '../../trivia/bank.js';

let items = null;
let loading = null;

export function setBluffRows(rows) {
  items = rows.map(([cat, q, a, v, lies]) => ({ id: qHash(q), cat, q, a, v, lies }));
}

export function loadBluffBank() {
  if (items) return Promise.resolve(items);
  if (!loading) {
    loading = fetch(new URL('../../../data/bluff/questions.json', import.meta.url))
      .then(r => r.json())
      .then(j => { setBluffRows(j.questions); return items; })
      .catch(e => { loading = null; throw e; });
  }
  return loading;
}

export const bluffBankSize = () => (items ? items.length : 0);

// Random question not in `used` (a Set of ids). Null if the bank isn't loaded.
// If the room has somehow used every question, repeats are allowed rather than stalling.
export function pickQuestion(used, rand = Math.random) {
  if (!items) return null;
  const fresh = items.filter(it => !used.has(it.id));
  const pool = fresh.length ? fresh : items;
  return pool[Math.floor(rand() * pool.length)];
}
