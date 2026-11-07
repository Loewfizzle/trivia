// Static server for local testing: node scripts/serve.mjs [port] [--emu]
// Then open http://localhost:5173/?emu (emulators) — add &slot=2, &slot=3 for more players.
// Text assets are gzipped like Vercel does, so Lighthouse numbers are representative.
// /api/<name> runs api/<name>.js like Vercel does (needs `npm install` at the repo root for firebase-admin);
// --emu points those functions at the local emulators (database :9000, auth :9099). /board and /admin map to
// board.html / admin.html like Vercel's cleanUrls.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const root = fileURLToPath(new URL('..', import.meta.url));
const port = Number(process.argv.slice(2).find(a => /^\d+$/.test(a))) || 5173;
if (process.argv.includes('--emu')) {
  process.env.FIREBASE_DATABASE_EMULATOR_HOST ||= '127.0.0.1:9000';
  process.env.FIREBASE_AUTH_EMULATOR_HOST ||= '127.0.0.1:9099';
  process.env.GCLOUD_PROJECT ||= 'demo-arcade';
}
const apis = new Map();
async function runApi(name, req, res) {
  if (!/^[a-z]+$/.test(name)) { res.writeHead(404).end(); return; }
  try {
    if (!apis.has(name)) apis.set(name, (await import(new URL(`../api/${name}.js`, import.meta.url))).default);
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

createServer(async (req, res) => {
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
  if (path === '/board' || path === '/admin' || path === '/lab' || path === '/daychart') path += '.html';
  const file = normalize(join(root, path.endsWith('/') ? `${path}index.html` : path));
  if (!file.startsWith(root)) { res.writeHead(403).end(); return; }
  try {
    let body = await readFile(file);
    const ext = extname(file);
    const headers = { 'content-type': types[ext] || 'application/octet-stream', 'cache-control': 'no-store' };
    if (compressible.has(ext) && /\bgzip\b/.test(req.headers['accept-encoding'] || '')) {
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
}).listen(port, () => console.log(`serving ${root} on http://localhost:${port}`));
