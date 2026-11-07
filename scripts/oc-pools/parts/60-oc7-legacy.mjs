// OVERCLOCK POOLS (OC7) — what OC1–OC5's four small banks become: CLOSEST CALL (hand/legacy-closest.json), MISSING LINK
// (hand/legacy-missinglink.json), SPELLCHECK (hand/legacy-spellcheck.json) and the shared bundled trivia (data/trivia/fallback.json — it stays
// for HIGH STAKES, LAST SIGNAL …; OVERCLOCK may fold its good questions in). Each legacy row is kept ONLY when it passes this pass's checks:
//   SPELLCHECK   — the right spelling in the American dictionary, no wrong one a word anywhere (dict.mjs), its hard letters from the misspelling
//   MISSING LINK — each clue's join a real word (dict.mjs) or a phrase on record (phrases.mjs), the side + the gap recorded
//   CLOSEST CALL — re-written in US units with a source + proof (written/cc-*.json — 70-written-closest) — the legacy rows are NOT kept as is
//   TRIVIA       — folded in only as written rows with a source + proof (written/tv-*.json) — the legacy rows are NOT kept as is
// (OC7 Group 0 shipped them unchecked, src 'legacy', to keep the game playable between the commits — Group 2 put the checks on.)
import { join } from 'node:path';
import { HERE, readJSON, hash36 } from '../lib.mjs';
import { dictionaries } from '../dict.mjs';
import { hardLetters } from '../spell-rules.mjs';
import { joinKind } from '../phrases.mjs';

export default async function legacy(ctx) {
  const { isWord, anyWord } = dictionaries();
  // SPELLCHECK
  let spKept = 0, spAll = 0;
  for (const [right, ...wrong] of readJSON(join(HERE, 'hand', 'legacy-spellcheck.json')).words) {
    spAll++;
    if (!isWord(right)) { ctx.drop('sp', 'legacy: not in the American dictionary', right); continue; }
    const bad = wrong.filter(w => anyWord(w));
    if (bad.length) { ctx.drop('sp', 'legacy: a wrong option is a word', `${right} (${bad.join(', ')})`); continue; }
    ctx.sp.push({ id: `s-${right}`, right, wrong, hard: hardLetters(right, wrong[0]), src: `https://en.wiktionary.org/wiki/${right}` });
    spKept++;
  }
  // MISSING LINK
  let mlKept = 0, mlAll = 0;
  for (const [a, b, c, answer, alt] of readJSON(join(HERE, 'hand', 'legacy-missinglink.json')).puzzles) {
    mlAll++;
    const clues = [a, b, c].map(w => [w, ...(joinKind(w, answer) || [])]);
    if (clues.some(cl => cl.length < 3)) { ctx.drop('ml', 'legacy: a join not on record', `${answer}: ${clues.filter(cl => cl.length < 3).map(cl => cl[0]).join(', ')}`); continue; }
    ctx.ml.push({ id: `m-${answer.toLowerCase()}`, clues, answer, accept: alt ? alt.split('|') : [], src: `wiktionary:${clues.map(([w, side, sep]) => (side === 'before' ? `${answer}${sep}${w}` : `${w}${sep}${answer}`).toLowerCase().replace(/ /g, '_')).join(',')}` });
    mlKept++;
  }
  // TRIVIA + CLOSEST CALL — UNCHECKED, only until the written + data-built rows land (OC7 Group 0 → Groups 1–2): off once they do
  if (INTERIM) {
    const CATS = { science: 'science', geography: 'geography', history: 'history', screen: 'screen', music: 'music', sports: 'sports', arts: 'books', general: 'science' };
    for (const [cat, d, q, a, ...w] of readJSON(join(HERE, '..', '..', 'data', 'trivia', 'fallback.json')).questions) ctx.tv.push({ id: `l${hash36(q)}`, cat: CATS[cat], d, q, a, w, src: 'legacy' });
    const UNIT = { km: ['km', /in kilomet(re|er)s/, 'in miles'], m: ['m', /in met(re|er)s/, 'in feet'], 'km/h': ['kmh', /in km per hour/, 'in miles per hour'], kg: ['kg', /in kilograms/, 'in pounds'] };
    for (const [cat, q, v, unit] of readJSON(join(HERE, 'hand', 'legacy-closest.json')).questions) {
      const u = UNIT[unit];
      if (u && !u[1].test(q)) continue;
      ctx.cc.push({ id: `l${hash36(q)}`, cat, q: u ? q.replace(u[1], u[2]) : q, value: v, unit: u ? u[0] : unit, src: 'legacy' });
    }
  }
  ctx.log.push(`LEGACY (OC1–OC5): SPELLCHECK ${spKept} of ${spAll} kept · MISSING LINK ${mlKept} of ${mlAll} kept`);
}
const INTERIM = true;
