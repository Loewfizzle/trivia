// THE KID-SAFE FILTER (THE POOL FIXES, Nov 13 — the owner's rule 4: "a KID-SAFE filter (a blocklist + a check), run on every bank").
// THE ALL-AGES RULE (lib.mjs#BANNED) bans single words; this list bans the TITLES, NAMES, SLANG and SLURS a mixed room of kids + adults
// must never be dealt — the fact-check review's finds first (each removed AND listed here, so no rebuild can bring one back), then their
// close relatives. Matched on WHOLE WORDS of the normalised text (lib.mjs#norm — "squawk" is not "squaw"), multi-word entries as a phrase.
// Run on EVERY bank: every OVERCLOCK pool's texts (questions, answers, statements, labels, sort cards, clues, a MISSING LINK's JOINED words,
// spellings + their wrong options) in build.mjs, THE PASSWORD's answers in scripts/pw-words/build.mjs — and again by the content tests on
// every shipped + reserved item (tests/overclock-pool-rules.test.mjs). Node only; never shipped.
import { norm } from './lib.mjs';

export const KIDSAFE = [
  // the review's finds (Nov 13): an antisemitic forgery · an erotic novel · a novel about child abuse · the painter of an explicit nude ·
  // a garbled title that reads as a slur · a retired slur in a place name · sexual slang (a MISSING LINK join, a spelling)
  'protocols of the elders of zion', 'elders of zion', 'fifty shades', 'lolita', 'courbet', 'hijo gey', 'gey', 'squaw', 'squaw valley',
  'hookup', 'hook up', 'hookups', 'bareback', 'slutty', 'slut', 'sluts',
  // their relatives: the same kinds a later rebuild could pull in
  'erotic', 'erotica', 'erotically', 'kama sutra', 'playboy', 'hustler', 'stripper', 'strippers', 'striptease', 'brothel', 'brothels', 'prostitute',
  'prostitutes', 'prostitution', 'harlot', 'whore', 'whores', 'mistress', 'adultery', 'incest', 'pedophile', 'paedophile', 'molest', 'molested',
  'lingerie', 'condom', 'condoms', 'orgy', 'orgasm', 'horny', 'kinky', 'fetish', 'bondage', 'raunchy', 'sexting', 'hooker', 'hookers',
  'mein kampf', 'swastika', 'kkk', 'ku klux klan', 'redskins', 'redskin', 'injun', 'eskimo', 'gypsy', 'gypsies', 'retard', 'retarded',
  'bitch', 'bastard', 'boner', 'boob', 'boobs', 'booty', 'butthead', 'crack pipe', 'meth', 'methamphetamine', 'lsd', 'ecstasy pill',
];

const PHRASES = KIDSAFE.map(norm);
/** the kid-safe terms a text carries (whole words / whole phrases of its normalised form) — [] = safe */
export function unsafeIn(text) {
  const t = ` ${norm(text)} `;
  return PHRASES.filter(p => t.includes(` ${p} `));
}
