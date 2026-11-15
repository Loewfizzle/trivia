// CITY B — THE BOOT TRIM's PROOF (the owner, Nov 15: "prove nothing else changed"): every changed .js file against a git ref, with its
// whole-line `//` comments removed on BOTH sides — they must be byte-identical (a comment-only change). A line of code, a trailing comment,
// a string or a JSDoc block that changed shows here as a difference.
//   node scripts/comment-only-diff.mjs [ref = HEAD] [files…]      (no files: every .js file that differs from ref in the working tree)
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const [ref = 'HEAD', ...given] = process.argv.slice(2);
const git = (...a) => execFileSync('git', a, { encoding: 'utf8', maxBuffer: 64 << 20 });
const files = given.length ? given : git('diff', '--name-only', ref, '--', '*.js').split('\n').filter(Boolean);
/** the source with every whole-line `//` comment dropped (line endings normalised to LF) */
export const codeOnly = s => s.replace(/\r\n/g, '\n').split('\n').filter(l => !/^\s*\/\/(?!\/)/.test(l)).join('\n');
let bad = 0;
for (const f of files) {
  let a = ''; try { a = git('show', `${ref}:${f}`); } catch { console.log(`NEW  ${f} (not in ${ref})`); bad++; continue; }
  const b = readFileSync(f, 'utf8'), same = codeOnly(a) === codeOnly(b);
  const drop = (a.length - b.length) / 1024;
  console.log(`${same ? 'SAME' : 'DIFF'} ${f}  (${drop >= 0 ? '−' : '+'}${Math.abs(drop).toFixed(1)} KB of comment lines)`);
  if (!same) bad++;
}
console.log(bad ? `${bad} file(s) changed more than comments` : `${files.length} file(s): comments only — the code is identical`);
process.exit(bad ? 1 : 0);
