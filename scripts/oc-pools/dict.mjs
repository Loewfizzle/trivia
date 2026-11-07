// OVERCLOCK POOLS (OC7) — THE DICTIONARIES: SPELLCHECK's "the right spelling is a word, every wrong one is NOT" and MISSING LINK's "the joined
// word is a real word". Node only (the build + the content test); never shipped. Committed, gzipped, in scripts/oc-pools/dict/:
//   en_US.dic.gz + en_US.aff   Hunspell en_US from SCOWL (size 60 — "generally only one spelling variant for a word"), via the dictionary-en
//                              package 4.0.0 (wooorm) — SCOWL's permissive licence (MIT-like; LICENSE-SCOWL.txt) · THE AMERICAN DICTIONARY
//   en_GB.dic.gz               Hunspell en_GB from SCOWL (dictionary-en-gb 3.0.0, the same affix file) — a WRONG option is never a British word
//   enable1.txt.gz             ENABLE2K (public domain) — the big word game list: a WRONG option is never in it either (calender, florescent …)
// The .dic stems are expanded with the affix rules (PFX / SFX, cross products) into every inflected form.
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join } from 'node:path';
import { HERE } from './lib.mjs';

const DIR = join(HERE, 'dict');
const gz = f => gunzipSync(readFileSync(join(DIR, f))).toString('utf8');

function parseAff(text) {
  const rules = {};
  for (const line of text.split(/\r?\n/)) {
    const p = line.trim().split(/\s+/);
    if ((p[0] !== 'PFX' && p[0] !== 'SFX') || p.length < 4) continue;
    const [kind, flag] = p;
    if (p.length === 4) { rules[flag] = { kind, cross: p[2] === 'Y', list: [] }; continue; }
    const strip = p[2] === '0' ? '' : p[2], add = p[3] === '0' ? '' : p[3].split('/')[0];
    const cond = new RegExp(kind === 'SFX' ? `${p[4] === '.' ? '' : p[4]}$` : `^${p[4] === '.' ? '' : p[4]}`);
    rules[flag].list.push({ strip, add, cond });
  }
  return rules;
}
const apply = (w, r, kind) => r.list.filter(x => x.cond.test(w)).map(x => (kind === 'SFX'
  ? (x.strip && !w.endsWith(x.strip) ? null : w.slice(0, w.length - x.strip.length) + x.add)
  : (x.strip && !w.startsWith(x.strip) ? null : x.add + w.slice(x.strip.length)))).filter(Boolean);

/** every form of a Hunspell dictionary (lower case kept as written: a stem written Capitalized is a NAME) */
function expand(dicText, rules) {
  const out = new Set();
  const lines = dicText.split(/\r?\n/).slice(1);
  for (const line of lines) {
    if (!line) continue;
    const [stem, flagStr = ''] = line.split('/');
    const flags = [...flagStr];
    out.add(stem);
    const sfx = flags.map(f => rules[f]).filter(r => r && r.kind === 'SFX');
    const pfx = flags.map(f => rules[f]).filter(r => r && r.kind === 'PFX');
    const suffixed = [];
    for (const r of sfx) for (const w of apply(stem, r, 'SFX')) { out.add(w); if (r.cross) suffixed.push(w); }
    for (const r of pfx) {
      for (const w of apply(stem, r, 'PFX')) out.add(w);
      if (r.cross) for (const s of suffixed) for (const w of apply(s, r, 'PFX')) out.add(w);
    }
  }
  return out;
}

let cache = null;
/** → { us: Set (every en_US form, case kept), gb: Set, enable: Set, isWord(w) — en_US lower case only (no names) } */
export function dictionaries() {
  if (cache) return cache;
  const rules = parseAff(readFileSync(join(DIR, 'en_US.aff'), 'utf8'));
  const us = expand(gz('en_US.dic.gz'), rules);
  const gb = expand(gz('en_GB.dic.gz'), rules);
  const enable = new Set(gz('enable1.txt.gz').split('\n').map(w => w.trim()).filter(Boolean));
  const lower = s => new Set([...s].map(w => w.toLowerCase()));
  const usLower = lower(us), gbLower = lower(gb);
  cache = {
    us, gb, enable,
    /** a plain American word (written in lower case in en_US — never only as a name) */
    isWord: w => us.has(String(w).toLowerCase()),
    /** any word at all: en_US, en_GB or ENABLE, any case — a WRONG spelling must be none of these */
    anyWord: w => { const x = String(w).toLowerCase(); return usLower.has(x) || gbLower.has(x) || enable.has(x); },
  };
  return cache;
}
