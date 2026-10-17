// Regenerates the unlit NEON sign inlined in index.html's boot screen from js/ui/logo.js (glass tubes only: no
// filters, no light), so the boot screen and the title's dark sign always match.
//   node scripts/build-boot-logo.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { logoSvg } from '../js/ui/logo.js';

const file = new URL('../index.html', import.meta.url);
let svg = logoSvg({ id: 'nb' });
svg = svg
  .replace(/<defs>[\s\S]*?<\/defs>/, '')
  .replace(/<g class="ndl-light">[\s\S]*?<\/g>/g, '')
  .replace(/\n\s*/g, '')
  .replace('class="nd-logo"', 'class="boot-logo"');
const html = readFileSync(file, 'utf8');
const out = html.replace(/<svg class="boot-logo"[\s\S]*?<\/svg>/, svg);
if (out === html && !html.includes(svg)) throw new Error('boot logo not found in index.html');
writeFileSync(file, out);
console.log(`boot logo: ${svg.length} bytes`);
