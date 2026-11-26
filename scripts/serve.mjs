// Static server for local testing: node scripts/serve.mjs [port] [--emu] [--h2] [--raw] [--root <dir>]
// THE HOUSEKEEPING PASS (Nov 25) — THE DEPLOY'S FILES, IN MEMORY: /boot-bundle.json is no longer committed (built at deploy —
// scripts/deploy-build.mjs). This server answers the deploy's three generated files — /boot-bundle.json, the page (its ?v= stamped) and
// /file-hashes.json (+ the bundle's row) — from memory, through the SAME deployFiles() the deploy runs, rebuilt whenever a boot module (or the
// page, or the list) changes on disk: nothing is written to the working tree, and a test page never boots a stale bundle.
//   --raw          serve the files exactly as they are on disk (a deploy's OUTPUT — tests/integration/deploy-sim.mjs — or "no bundle at all")
//   --root <dir>   serve another folder (its own /api too) instead of this checkout
// (--h2 — THE BEFORE-LAUNCH PASS: HTTP/2 over TLS like Vercel's edge, a self-signed localhost certificate made with openssl in the OS temp folder;
//  the browser needs --ignore-certificate-errors. For the cold-load measurements: on HTTP/1.1 a 300-module boot queues on 6 connections)
// Then open http://localhost:5173/?emu (emulators) — add &slot=2, &slot=3 for more players.
// Text assets are gzipped like Vercel does, so Lighthouse numbers are representative.
// /api/<name> runs api/<name>.js like Vercel does (needs `npm install` at the repo root for firebase-admin);
// --emu points those functions at the local emulators (database :9000, auth :9099). /board and /admin map to
// board.html / admin.html like Vercel's cleanUrls.
import { createServer } from 'node:http';
import { createSecureServer } from 'node:http2';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { gzipSync, brotliCompressSync, constants as Z } from 'node:zlib';

const ARGV = process.argv.slice(2), rootAt = ARGV.indexOf('--root');
const HERE = fileURLToPath(new URL('..', import.meta.url));
const root = rootAt >= 0 && ARGV[rootAt + 1] ? join(resolve(ARGV[rootAt + 1]), sep) : HERE;
const RAW = ARGV.includes('--raw') || root !== HERE;   // (another folder is served as it is: the builders here read THIS checkout)
const port = Number(ARGV.filter((a, i) => i !== rootAt + 1 || rootAt < 0).find(a => /^\d+$/.test(a))) || 5173;
if (process.argv.includes('--emu')) {
  process.env.FIREBASE_DATABASE_EMULATOR_HOST ||= '127.0.0.1:9000';
  process.env.FIREBASE_AUTH_EMULATOR_HOST ||= '127.0.0.1:9099';
  process.env.GCLOUD_PROJECT ||= 'demo-arcade';
}
const apis = new Map();
async function runApi(name, req, res) {
  if (!/^[a-z]+$/.test(name)) { res.writeHead(404).end(); return; }
  try {
    if (!apis.has(name)) apis.set(name, (await import(pathToFileURL(join(root, 'api', `${name}.js`)).href)).default);
    await apis.get(name)(req, res);
  } catch (e) {
    console.error('api', name, e);
    if (!res.headersSent) res.writeHead(e.code === 'ERR_MODULE_NOT_FOUND' ? 404 : 500, { 'content-type': 'application/json' }).end('{"error":"server"}');
  }
}
const types = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.mp3': 'audio/mpeg',
  '.webmanifest': 'application/manifest+json',
};
const compressible = new Set(['.html', '.js', '.css', '.json', '.svg', '.webmanifest']);

// ---- THE DEPLOY'S FILES, IN MEMORY (not --raw): built on the first ask, again when any boot module / the page / the list changed on disk
let deployLib = null, built = null;
async function deployed() {
  if (!deployLib) { const [d, b] = await Promise.all([import('./deploy-build.mjs'), import('./build-boot-bundle.mjs')]); deployLib = { ...d, bundleList: b.bundleList }; }
  const stamp = list => { let k = ''; for (const f of ['index.html', 'file-hashes.json', ...list]) { try { const st = statSync(join(root, f)); k += `${st.mtimeMs}:${st.size};`; } catch { k += 'x;'; } } return k; };
  if (built && stamp(built.list) === built.key) return built.files;
  const t0 = Date.now(), list = deployLib.bundleList(), key = stamp(list);
  const files = deployLib.deployFiles(readFileSync(join(root, 'index.html'), 'utf8'), readFileSync(join(root, 'file-hashes.json'), 'utf8'), list);
  const bad = deployLib.checkDeploy(files, list);
  if (bad.length) console.error(`THE DEPLOY'S FILES do not agree (a deploy would FAIL): ${bad.join(' · ')}`);
  built = { key, list, files: Object.fromEntries(Object.entries(files).map(([f, t]) => [`/${f}`, Buffer.from(t, 'utf8')])) };
  console.log(`the deploy's files in memory: boot-bundle.json ${list.length} modules (${Date.now() - t0} ms)`);
  return built.files;
}
const H2 = process.argv.includes('--h2'), brCache = new Map();
function localCert() {
  const dir = tmpdir(), key = join(dir, 'ns-serve-h2.key'), cert = join(dir, 'ns-serve-h2.crt');
  if (!existsSync(key) || !existsSync(cert)) execFileSync('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-keyout', key, '-out', cert, '-days', '30', '-subj', '/CN=localhost'], { stdio: 'ignore' });
  return { key: readFileSync(key), cert: readFileSync(cert) };
}
const handler = async (req, res) => {
  let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  const api = /^\/api\/([^/]+)$/.exec(path);
  if (api) { await runApi(api[1], req, res); return; }
  // THE LOOK PAGES' DOOR (local only — OC8: the 404 below had cut the preview pages off from the server-only names since OC6): a
  // tests/integration/*-preview.html imports api/_lib/<name>.js as /__dev/api-lib/<name>.js — a plain .js name, never a sub-folder, never
  // api/_data (THE DAILY RESERVE stays 404). Vercel has no such path (THE WRONG DOOR), and nothing the site ships names it.
  const dev = /^\/__dev\/api-lib\/([a-z0-9-]+\.js)$/.exec(path);
  if (dev) path = `/api/_lib/${dev[1]}`;
  // like Vercel: api/ is functions only — its helpers + server-only data (api/_lib, THE DAILY RESERVE in api/_data — OC6) are never a file
  if (!dev && /^\/api(\/|$)/i.test(path)) { res.writeHead(404).end('not found'); return; }
  if (path === '/board' || path === '/admin' || path === '/lab' || path === '/daychart' || path === '/jaywalk-lab' || path === '/highrise-play' || path === '/freefall-lab' || path === '/freefall-play') path += '.html';
  const file = normalize(join(root, path.endsWith('/') ? `${path}index.html` : path));
  if (!file.startsWith(root)) { res.writeHead(403).end(); return; }
  try {
    const vp = path === '/' ? '/index.html' : path;
    const gen = !RAW && (vp === '/boot-bundle.json' || vp === '/index.html' || vp === '/file-hashes.json') ? (await deployed())[vp] : null;
    let body = gen || await readFile(file);
    const ext = extname(file);
    const headers = { 'content-type': types[ext] || 'application/octet-stream', 'cache-control': 'no-store' };
    // (--h2: brotli first, like Vercel's edge — each file compressed once, kept by its path + size)
    const ae = req.headers['accept-encoding'] || '';
    if (compressible.has(ext) && H2 && /\bbr\b/.test(ae)) {
      const k = `${file}|${body.length}|${gen && built ? built.key.length + built.key.slice(0, 40) : ''}`, hit = brCache.get(k);
      body = hit || brotliCompressSync(body, { params: { [Z.BROTLI_PARAM_QUALITY]: 11 } }); if (!hit) brCache.set(k, body);
      headers['content-encoding'] = 'br';
    } else if (compressible.has(ext) && /\bgzip\b/.test(ae)) {
      body = gzipSync(body);
      headers['content-encoding'] = 'gzip';
    }
    // byte ranges (audio seeking), like Vercel
    const rg = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || '');
    if (rg && !headers['content-encoding']) {
      const size = body.length, from = rg[1] ? Number(rg[1]) : size - Number(rg[2]), to = rg[1] && rg[2] ? Math.min(size - 1, Number(rg[2])) : size - 1;
      res.writeHead(206, { ...headers, 'accept-ranges': 'bytes', 'content-range': `bytes ${from}-${to}/${size}`, 'content-length': to - from + 1 }).end(body.subarray(from, to + 1));
      return;
    }
    headers['accept-ranges'] = 'bytes';
    res.writeHead(200, headers).end(body);
  } catch {
    // (THE VAULT 2C — like Vercel: an unknown PAGE path gets THE WRONG DOOR, /404.html, with a 404; a missing asset stays a plain 404)
    if (!extname(path)) { try { const body = await readFile(join(root, '404.html')); res.writeHead(404, { 'content-type': types['.html'], 'cache-control': 'no-store' }).end(body); return; } catch { /* fall through */ } }
    res.writeHead(404).end('not found');
  }
};
(H2 ? createSecureServer({ ...localCert(), allowHTTP1: true }, handler) : createServer(handler)).listen(port, () => console.log(`serving ${root} on ${H2 ? 'https' : 'http'}://localhost:${port}${H2 ? ' (HTTP/2)' : ''}`));
