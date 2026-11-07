// OVERCLOCK POOLS (OC6) — helpers shared by the build script, its sources and the content test. Node only (never shipped).
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = fileURLToPath(new URL('../../', import.meta.url));
export const HERE = fileURLToPath(new URL('./', import.meta.url));

/** FNV-1a (32-bit) → base 36 (the same hash deal.js uses) */
export function hash36(text) {
  let x = 0x811c9dc5;
  const s = String(text);
  for (let i = 0; i < s.length; i++) { x ^= s.charCodeAt(i); x = Math.imul(x, 0x01000193) >>> 0; }
  return x.toString(36);
}
const fnv = text => { let x = 0x811c9dc5; const s = String(text); for (let i = 0; i < s.length; i++) { x ^= s.charCodeAt(i); x = Math.imul(x, 0x01000193) >>> 0; } return x; };

/** a database-safe slug: [a-z0-9-] */
export const slug = (s, n = 40) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/['’]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, n).replace(/-$/, '');
/** text compared for duplicates: lower case, letters + digits only */
export const norm = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

/**
 * THE DAILY RESERVE's split (OC6 — docs/cartridge.md D2): a key whose hash lands in the bottom fifth goes SERVER-ONLY. Deterministic + stable:
 * an item keeps its side across rebuilds (the key = its id, or "statId:itemId" / "themeId:itemId").
 */
export const RESERVE_SHARE = 0.2;
export const isReserve = key => fnv(`oc6-reserve:${key}`) % 1000 < RESERVE_SHARE * 1000;

/** a JSON file with one row per line (readable diffs): head = the object's other keys, rows under `key` */
export function writeRows(path, head, key, rows) {
  mkdirSync(dirname(path), { recursive: true });
  const top = JSON.stringify(head).slice(0, -1);
  const body = rows.map(r => JSON.stringify(r)).join(',\n');
  writeFileSync(path, `${top}${top.length > 1 ? ',' : ''}"${key}":[\n${body}\n]}\n`);
}
export const readJSON = p => JSON.parse(readFileSync(p, 'utf8'));
export const readIf = (p, d) => (existsSync(p) ? readJSON(p) : d);

/** seeded PRNG (mulberry32) for deterministic builds */
export function seeded(seed) {
  let s = fnv(seed) | 0;
  return () => { s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
export const shuffled = (rand, list) => { const a = list.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

/** THE ALL-AGES RULE (the owner's decision 4): words no pool item may carry (the content test checks every shipped + reserved text) */
export const BANNED = ['kill', 'killed', 'killing', 'murder', 'bloody', 'gore', 'sex', 'sexy', 'nude', 'naked', 'porn', 'drug', 'drugs',
  'cocaine', 'heroin', 'marijuana', 'cannabis', 'opium', 'beer', 'wine', 'vodka', 'whiskey', 'whisky', 'rum', 'tequila', 'alcohol',
  'alcoholic', 'drunk', 'brewery', 'cigarette', 'cigar', 'tobacco', 'smoking', 'suicide', 'genocide', 'holocaust', 'nazi', 'slave', 'slavery',
  'terrorist', 'terrorism', 'torture', 'execution', 'executed', 'rape', 'abortion', 'casino', 'gambling', 'gun', 'guns', 'rifle', 'revolver',
  'pistol', 'bomb', 'bombing', 'massacre', 'corpse', 'satan', 'devil', 'hell', 'damn', 'jesus', 'allah', 'bible', 'quran', 'koran', 'church',
  'tetris', 'tetromino', 'republican', 'democrat', 'trump', 'biden', 'obama', 'hitler', 'stalin', 'mussolini'];
export const bannedIn = text => { const w = norm(text).split(' '); return BANNED.filter(b => (b.includes(' ') ? norm(text).includes(b) : w.includes(b))); };

/** THE PHONE LIMITS */
export const TF_MAX = 90;
export const LABEL_MAX = 32;
