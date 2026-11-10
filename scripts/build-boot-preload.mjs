// LOAD FIX 2 (Nov 9) — THE BOOT PRELOAD: the owner's iPhone, "slow to load — EVERY time". The boot's modules arrive as a WATERFALL: a
// module is asked for only once its importer has arrived — the boot graph's longest chain is 11 imports, the Harbor's graph (a dynamic
// import in title.js, started only once the boot graph has run) 11 more, the weather's effects a third — and every file goes back to
// the network on EVERY load (Vercel's max-age=0 + the network-first service worker). Each level = one round trip on the phone's line.
// This writes ONE inline script into index.html (between the BOOT PRELOAD markers) that asks for EVERY module the first picture needs
// at once — `<link rel="modulepreload">` (Safari 17+; an older browser ignores it — the imports still load as before) — so the whole
// graph is ONE round trip deep. The list = the static graph of js/app.js + of each ENTRY below (the dynamic imports every load makes
// before the reveal). GENERATED — run `node scripts/build-boot-preload.mjs` after a module's imports change; tests/boot-preload.test.mjs
// fails when index.html is stale. `--check` = exit 1 when stale (no write).
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { bootGraph } from './boot-bytes.mjs';

const ROOT = resolve(dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, '$1')), '..');
// (the dynamic imports EVERY load makes before the reveal — boot-time.mjs's request list, Nov 9: the city, the weather's effects + the
// holiday props' module (the reveal waits for both: `extras`), the dock's DAILY (`today`) + the profile it reads)
export const ENTRIES = [
  'js/screens/harbor/scene.js',
  'js/screens/harbor/weather-fx.js',
  'js/screens/harbor/frost.js',
  'js/screens/harbor/holidayprops.js',
  'js/daily/today.js',
  'js/profile/me.js',
  'js/profile/queue.js',
  'js/profile/api.js',
];
export function preloadList() {
  const seen = new Set(), out = [];
  for (const e of ['js/app.js', ...ENTRIES]) {
    for (const r of bootGraph(e).rows.slice().sort((a, b) => a.f.localeCompare(b.f))) {
      if (!r.f.startsWith('js/') || seen.has(r.f)) continue;
      seen.add(r.f); out.push(r.f);
    }
  }
  // (js/app.js itself has its own <link rel="modulepreload"> + the <script type="module">)
  return out.filter(f => f !== 'js/app.js');
}
const A = '<!-- BOOT PRELOAD (GENERATED: node scripts/build-boot-preload.mjs — LOAD FIX 2; tests/boot-preload.test.mjs) -->', Z = '<!-- /BOOT PRELOAD -->';
export function preloadBlock(list = preloadList()) {
  const names = list.map(f => f.slice(3).replace(/\.js$/, ''));
  // (asked for once the four core sheets are in — index.html's __cssDone calls window.__bootPre — or at the latest 1.2 s in: Chrome holds
  //  the sheets' low-priority (print-media) requests behind 297 high-priority preloads on an HTTP/1.1 line — measured: the city laid out
  //  at 320×320 for 7 s; on the sheets first, then everything at once)
  return `${A}
  <script>window.__bootPre=function(){if(window.__bootPre.done)return;window.__bootPre.done=1;var l="${names.join(' ')}".split(" "),h=document.head;for(var i=0;i<l.length;i++){var e=document.createElement("link");e.rel="modulepreload";e.href="js/"+l[i]+".js";h.appendChild(e);}};if(window.__css>=4)window.__bootPre();else setTimeout(window.__bootPre,1200);</script>
  ${Z}`;
}
export function withPreload(html, block = preloadBlock()) {
  // (AFTER the stylesheets, at the head's end: the sheets are asked for first — 297 preloads ahead of them starved the CSS on a
  //  6-connection line, measured: the city laid out at 320×320 for 7 s)
  const i = html.indexOf(A), j = html.indexOf(Z);
  const bare = i >= 0 && j > i ? html.slice(0, i).replace(/\n\s*$/, '') + html.slice(j + Z.length) : html;
  const at = bare.indexOf('</head>');
  if (at < 0) throw new Error('index.html: no </head> to put THE BOOT PRELOAD before');
  return bare.slice(0, at).replace(/\s*$/, '') + '\n  ' + block + '\n' + bare.slice(at);
}
if (process.argv[1] && resolve(process.argv[1]) === resolve(ROOT, 'scripts/build-boot-preload.mjs')) {
  const file = resolve(ROOT, 'index.html'), html = readFileSync(file, 'utf8'), next = withPreload(html);
  if (process.argv.includes('--check')) { if (next !== html) { console.log('index.html: THE BOOT PRELOAD is stale — node scripts/build-boot-preload.mjs'); process.exit(1); } console.log('THE BOOT PRELOAD is current'); }
  else { writeFileSync(file, next); console.log(`index.html: THE BOOT PRELOAD — ${preloadList().length} modules`); }
}
