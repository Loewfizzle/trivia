// OVERCLOCK's pools as the game loads them (banks.js#FILES — the key each file's rows live under), for the tests.
import { readFileSync } from 'node:fs';

const J = f => JSON.parse(readFileSync(`data/oc/${f}`, 'utf8'));
export const BANKS = Object.freeze({
  trivia: J('trivia.json').items,
  truefalse: J('truefalse.json').items,
  timeline: J('timeline.json').themes,
  closest: J('closest.json').questions,
  missinglink: J('missinglink.json').puzzles,
  spellcheck: J('spellcheck.json').words,
  sortit: J('sortit.json').sets,
  higherlower: J('higherlower.json').stats,
});
