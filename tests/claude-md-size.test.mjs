// THE CLAUDE.md DIET's guard (FR7 FIXES C, Nov 13): CLAUDE.md is the SHORT guide every session reads in full.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const LIMIT = 40 * 1024;

test('CLAUDE.md stays under 40 KB', () => {
  const bytes = readFileSync(join(root, 'CLAUDE.md')).length;
  assert.ok(bytes <= LIMIT,
    `CLAUDE.md is ${bytes} bytes (> ${LIMIT}). Move the detail to the doc that owns the area (its section ` +
    `"THE RULES FROM CLAUDE.md (moved Nov 13)" or a heading of its own) and keep ONE line here with a pointer.`);
});

test('every "(moved)" doc CLAUDE.md points at has the moved section', () => {
  const md = readFileSync(join(root, 'CLAUDE.md'), 'utf8');
  const docs = new Set([...md.matchAll(/docs\/([a-z-]+)\.md \(moved\)/g)].map((m) => m[1]));
  assert.ok(docs.size >= 10);
  for (const d of docs) {
    const s = readFileSync(join(root, 'docs', `${d}.md`), 'utf8');
    assert.ok(s.includes('## THE RULES FROM CLAUDE.md (moved Nov 13)'), `docs/${d}.md has no moved section`);
  }
});
