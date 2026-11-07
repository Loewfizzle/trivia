// OVERCLOCK POOLS (OC7 Group 2) — MISSING LINK's NEW PUZZLES (hand/missinglink-written-*.json: [ANSWER, 'CLUE+ CLUE+ CLUE-'] — '+' = the answer
// AFTER the clue: SUN+ FLOWER = SUNFLOWER · '-' = BEFORE it: WORK- FIRE = FIREWORK · '_' = a two-word phrase: ICE+_ CREAM = ICE CREAM). Written by
// hand from everyday compounds + phrases; every row CHECKED here (phrases.mjs):
//   every join is real — a one-word join in the American dictionary or ENABLE · a two-word join with its own Wiktionary entry
//   THE ONE-ANSWER RULE — any OTHER everyday word that joins all three clues as one-word compounds (the American dictionary) is ACCEPTED too
//   (added to `accept`, logged) — never a puzzle with a second answer nobody can type
// A puzzle with a join that isn't on record is DROPPED. id = m-<answer>; src = the joined words (their Wiktionary entries).
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { HERE, readJSON } from '../lib.mjs';
import { dictionaries } from '../dict.mjs';
import { joinOk, joined } from '../phrases.mjs';

export default async function missingLink(ctx) {
  const { us, isWord } = dictionaries();
  // the one-word compound index: prefix → the words it starts, suffix → the words it ends (both halves real words, 3+ letters)
  const words = [...us].filter(w => /^[a-z]{3,9}$/.test(w));
  const lowerSet = new Set(words);
  const starts = new Map(), ends = new Map();
  for (const w of us) {
    if (!/^[a-z]{6,18}$/.test(w)) continue;
    for (let i = 3; i <= w.length - 3; i++) {
      const a = w.slice(0, i), b = w.slice(i);
      if (lowerSet.has(a) && lowerSet.has(b)) { (starts.get(a) || starts.set(a, new Set()).get(a)).add(b); (ends.get(b) || ends.set(b, new Set()).get(b)).add(a); }
    }
  }
  const partners = c => new Set([...(starts.get(c) || []), ...(ends.get(c) || [])]);
  const files = readdirSync(join(HERE, 'hand')).filter(f => /^missinglink-written-\d+\.json$/.test(f)).sort();
  let all = 0, kept = 0;
  const why = {}, alts = [];
  for (const f of files) {
    for (const [answer, spec] of readJSON(join(HERE, 'hand', f)).puzzles) {
      all++;
      const clues = String(spec).trim().split(/\s+/).map(t => { const m = /^([A-Z]+)([+-])(_?)$/.exec(t); return m ? [m[1], m[2] === '+' ? 'after' : 'before', m[3] ? ' ' : ''] : null; });
      const no = k => { why[k] = (why[k] || 0) + 1; ctx.drop('ml', `written: ${k}`, `${answer}: ${spec}`); };
      if (clues.length !== 3 || clues.some(c => !c)) { no('shape'); continue; }
      const bad = clues.filter(([w, side, sep]) => !joinOk(w.toLowerCase(), answer.toLowerCase(), side, sep));
      if (bad.length) { no('a join not on record'); continue; }
      // THE ONE-ANSWER RULE: another word every clue joins as a one-word compound → accepted too
      const sets = clues.map(([w]) => partners(w.toLowerCase()));
      const a = answer.toLowerCase();
      const other = [...sets[0]].filter(x => x !== a && x !== `${a}s` && x !== `${a}es` && `${x}s` !== a && sets[1].has(x) && sets[2].has(x) && isWord(x));
      if (other.length) alts.push(`${answer} (+ ${other.join(', ').toUpperCase()})`);
      ctx.ml.push({ id: `m-${a}`, clues, answer, accept: other.map(x => x.toUpperCase()),
        src: `wiktionary:${clues.map(([w, side, sep]) => joined(w, answer, side, sep).toLowerCase().replace(/ /g, '_')).join(',')}` });
      kept++;
    }
  }
  ctx.log.push(`MISSING LINK (written): ${all} written · ${kept} with every join on record · ${all - kept} dropped (${Object.entries(why).map(([k, v]) => `${k} ${v}`).join(' · ') || 'none'})`);
  if (alts.length) ctx.log.push(`  also accepted (a second word fits all three): ${alts.join(' · ')}`);
}
