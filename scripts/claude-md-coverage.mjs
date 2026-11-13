#!/usr/bin/env node
// THE CLAUDE.md DIET's proof (FR7 FIXES C, Nov 13): nothing the OLD CLAUDE.md named is lost.
// Takes the old CLAUDE.md from git (default: 48e3e157, the last commit before the diet) and checks that every
// backticked name (files, functions, flags) and every ALL-CAPS rule name in it appears in the NEW CLAUDE.md
// OR in a docs/*.md (top level). Prints the missing ones; exits 1 when any is missing.
//   node scripts/claude-md-coverage.mjs [ref]
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const ref = process.argv[2] || '48e3e157';
const old = execFileSync('git', ['show', `${ref}:CLAUDE.md`], { cwd: root, encoding: 'utf8', maxBuffer: 1 << 26 });
const norm = (s) => s.replace(/\r\n/g, '\n');
const hay = [norm(readFileSync(join(root, 'CLAUDE.md'), 'utf8'))];
for (const f of readdirSync(join(root, 'docs'))) if (f.endsWith('.md')) hay.push(norm(readFileSync(join(root, 'docs', f), 'utf8')));
// whitespace-insensitive: a name wrapped across two lines still counts
const flat = hay.map((s) => s.replace(/\s+/g, ' ')).join('\n');
const has = (needle) => flat.includes(needle.replace(/\s+/g, ' '));

const ticks = new Set();
for (const m of norm(old).matchAll(/`([^`\n]+)`/g)) ticks.add(m[1].trim());

// ALL-CAPS rule names: maximal runs of capital words (2+ words), or a single capital word of 4+ letters.
const caps = new Set();
const WORD = /^[A-Z0-9][A-Z0-9'’&.+-]*$/;
const hasLetters = (w) => (w.match(/[A-Z]/g) || []).length >= 2;
for (const line of norm(old).split('\n')) {
  const words = line.replace(/`[^`]*`/g, ' | ').split(/[\s,;:()*"“”—–/·→←]+/);
  let run = [];
  const flush = () => {
    const ws = run.map((w) => w.replace(/[.'’-]+$/, '')).filter(Boolean);
    if (ws.length >= 2) caps.add(ws.join(' '));
    else if (ws.length === 1 && /^[A-Z]{4,}$/.test(ws[0])) caps.add(ws[0]);
    run = [];
  };
  for (const w of words) {
    if (w && WORD.test(w) && hasLetters(w)) run.push(w);
    else flush();
  }
  flush();
}

// a run split by punctuation in the old text may sit in a doc with other punctuation — fall back to each word
const missing = [];
for (const t of ticks) if (!has(t)) missing.push(['tick', t]);
for (const c of caps) {
  if (has(c)) continue;
  // a run counts when its words appear in order inside one doc paragraph-ish window (the old text re-flowed)
  const re = new RegExp(c.split(' ').map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('[^A-Za-z0-9]+'));
  if (!re.test(flat)) missing.push(['caps', c]);
}
console.log(`old CLAUDE.md @ ${ref}: ${old.length} bytes · ${ticks.size} backticked names · ${caps.size} ALL-CAPS names`);
console.log(`new CLAUDE.md: ${hay[0].length} bytes`);
for (const [k, v] of missing) console.log(`  MISSING ${k}: ${v}`);
console.log(`${missing.length} missing`);
process.exit(missing.length ? 1 : 0);
