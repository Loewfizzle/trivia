// Names on the global boards, PURE. Separate from the chat filter (which a host can switch off): this one is always on.
// A name that trips it shows as "Player#tag" on every board until the player changes it. Matching runs on a folded
// form (lowercase, look-alike digits and symbols mapped to letters, everything else dropped), and every root is a
// pattern where each letter may repeat ("phuuuck", "f.u.c.k", "fvck" are caught) but never fewer times than in the
// root (so "boob" never matches Bob). Short roots that hide inside ordinary words only match a whole word.
import { sanitizeName } from './room-logic.js';
import { NAME_MAX } from '../config.js';

const LEET = { 0: 'o', 1: 'i', 3: 'e', 4: 'a', 5: 's', 7: 't', 8: 'b', 9: 'g', '@': 'a', $: 's', '!': 'i', '|': 'i', '+': 't', '€': 'e', '¢': 'c' };
// roots that are offensive wherever they appear (none of them sits inside a common word or name)
const ANYWHERE = [
  'fuck', 'fvck', 'phuck', 'fuk', 'shit', 'cunt', 'nigger', 'nigga', 'niga', 'faggot', 'fagot', 'retard', 'rapist', 'raping',
  'whore', 'slut', 'bitch', 'biatch', 'pussy', 'cocksuck', 'dickhead', 'motherf', 'asshole', 'arsehole', 'bastard', 'wanker',
  'twat', 'jizz', 'penis', 'vagina', 'dildo', 'blowjob', 'handjob', 'porn', 'hitler', 'nazi', 'kkk', 'kike', 'chink', 'spick',
  'wetback', 'tranny', 'pedo', 'paedo', 'molest', 'incest', 'cum', 'boob', 'tits', 'clit', 'semen', 'orgasm', 'anus', 'bollock',
  'siegheil', 'killyourself', 'kys',
];
// roots too short or too common to match inside other words: whole words only
const WHOLE = ['fag', 'fags', 'rape', 'coon', 'spic', 'dyke', 'anal', 'sex', 'cock', 'dick', 'tit', 'ass', 'gook', 'homo', 'isis', 'negro', 'piss', 'poop', 'turd', 'wank', 'nude', 'heil'];
// innocent words and names that contain an ANYWHERE root
const ALLOW = ['scunthorpe', 'cumberbatch', 'cumulus', 'cucumber', 'circumference', 'document', 'accumulate', 'succumb', 'cumin', 'cummings',
  'kumquat', 'dickens', 'dickson', 'dickinson', 'pedometer', 'pedro', 'speedo', 'torpedo', 'tornado', 'anusha', 'shitake', 'shiitake',
  'semenya', 'therapist', 'grapist', 'hancock', 'peacock', 'cocktail', 'titus', 'nigaam', 'kyser', 'kyss'];

/** Lowercase, accents stripped, look-alikes mapped, only letters kept. */
export function fold(s) {
  let out = '';
  for (const ch of String(s || '').toLowerCase().normalize('NFKD')) {
    const c = LEET[ch] || ch;
    if (c >= 'a' && c <= 'z') out += c;
  }
  return out;
}
// 'boob' → /b+o{2,}b+/ : every letter may repeat, never fewer times than in the root
function rootPattern(root) {
  let src = '';
  for (let i = 0; i < root.length;) {
    let j = i;
    while (root[j] === root[i]) j++;
    src += j - i > 1 ? `${root[i]}{${j - i},}` : `${root[i]}+`;
    i = j;
  }
  return src;
}
const ANY_RE = new RegExp(ANYWHERE.map(rootPattern).join('|'));
const WHOLE_RE = new RegExp(`^(?:${WHOLE.map(rootPattern).join('|')})$`);
const ALLOW_RE = new RegExp(ALLOW.join('|'), 'g');

/** True when a name must not appear on a global board. */
export function isOffensive(name) {
  const f = fold(name);
  if (!f) return false;
  if (ANY_RE.test(f.replace(ALLOW_RE, '_'))) return true;
  if (WHOLE_RE.test(f)) return true;
  // whole words: split the raw name on anything that isn't a letter or a look-alike
  const words = String(name || '').toLowerCase().split(/[^a-z0-9@$!|+À-ɏ]+/).map(fold).filter(Boolean);
  return words.some(w => WHOLE_RE.test(w));
}

/** The key a name's tags are unique under ("Mike" and "MIKE " share tags). */
export const nameKey = name => sanitizeName(name, NAME_MAX).toLowerCase();

export const cleanBoardName = name => sanitizeName(name, NAME_MAX);

/** The name a global board shows: offensive (or empty) names read "Player" until changed. */
export const boardName = name => (isOffensive(name) || !cleanBoardName(name) ? 'Player' : cleanBoardName(name));

export const isTag = t => /^\d{4}$/.test(String(t));
export const fmtTag = t => `#${String(t).padStart(4, '0')}`;
