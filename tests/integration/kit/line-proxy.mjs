// LOAD FIX 3 — THE LINE: a small HTTP proxy in front of a local site server (scripts/serve.mjs) that plays a phone's line + Vercel's caching,
// so a browser test sees what the owner's iPhone sees on home Wi-Fi:
//   - Vercel's headers on the static files: `cache-control: public, max-age=0, must-revalidate` + an ETag (a 304 on If-None-Match) — the
//     local server says no-store, so without this a warm load re-downloads every file and the service worker's revalidation never happens
//   - a round trip per request (`rtt` ms) + a shared bandwidth (`mbps`) — a home Wi-Fi-like line
//   - a dropped request now and then (`drop` — 0…1: the socket is destroyed, as a flaky Wi-Fi does), only on the static files
//   - THE DEPLOY SWITCH: GET /__line/switch?to=http://localhost:5174 moves the upstream at once (version A → B mid-visit: VERSION SKEW)
//   - GET /__line/stats: the requests seen, the 304s, the drops, the upstream
//   node tests/integration/kit/line-proxy.mjs [--port 5181] [--to http://localhost:5173] [--rtt 40] [--mbps 40] [--drop 0]
// Used by tests/integration/wk-freeze.mjs (it starts one itself). Never shipped; local only.
import { createServer, request } from 'node:http';
import { createHash } from 'node:crypto';

export function startLine({ port = 5181, to = 'http://localhost:5173', rtt = 40, mbps = 40, drop = 0, log = false, fail = null, failN = 1, stall = null, stallN = Infinity } = {}) {
  let upstream = to;
  // (fail: a RegExp — the first failN requests whose path matches are dropped, then it answers; stall: a RegExp — those never answer)
  let failRe = fail ? new RegExp(fail) : null, failLeft = failN, stallRe = stall ? new RegExp(stall) : null, stallLeft = stallN;
  const st = { req: 0, n304: 0, drops: 0, bytes: 0, byPath: new Map() };
  let busyUntil = 0;   // the shared line: when the last byte queued on it leaves
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const send = async (res, code, headers, body) => {
    // the round trip, then the bytes through the one shared line
    const bytes = body ? body.length : 0;
    const now = Date.now(), dur = (bytes * 8) / (mbps * 1e6) * 1000;
    const start = Math.max(now + rtt / 2, busyUntil);
    busyUntil = start + dur;
    await wait(Math.max(0, busyUntil - now + rtt / 2));
    st.bytes += bytes;
    res.writeHead(code, headers); res.end(body);
  };
  const fetchUp = (req, body) => new Promise((ok, bad) => {
    const u = new URL(req.url, upstream);
    const h = { ...req.headers }; delete h['if-none-match']; delete h['if-modified-since']; delete h['accept-encoding']; h.host = u.host;
    const r = request(u, { method: req.method, headers: h }, up => {
      const parts = []; up.on('data', d => parts.push(d)); up.on('end', () => ok({ status: up.statusCode, headers: up.headers, body: Buffer.concat(parts) })); up.on('error', bad);
    });
    r.on('error', bad); if (body && body.length) r.write(body); r.end();
  });
  const server = createServer(async (req, res) => {
    const path = req.url.split('?')[0];
    if (path === '/__line/switch') { upstream = new URL(req.url, 'http://x').searchParams.get('to') || upstream; res.end(JSON.stringify({ upstream })); return; }
    if (path === '/__line/paths') { res.setHeader('content-type', 'application/json'); res.end(JSON.stringify(Object.fromEntries(st.byPath))); st.byPath.clear(); return; }
    if (path === '/__line/stats') { res.setHeader('content-type', 'application/json'); res.end(JSON.stringify({ upstream, req: st.req, n304: st.n304, drops: st.drops, kb: Math.round(st.bytes / 1024) })); return; }
    if (path === '/__line/set') { const q = new URL(req.url, 'http://x').searchParams; if (q.has('rtt')) rtt = +q.get('rtt'); if (q.has('mbps')) mbps = +q.get('mbps'); if (q.has('drop')) drop = +q.get('drop'); if (q.has('fail')) { failRe = q.get('fail') ? new RegExp(q.get('fail')) : null; failLeft = +(q.get('n') || 1); } if (q.has('stall')) stallRe = q.get('stall') ? new RegExp(q.get('stall')) : null; res.end(JSON.stringify({ rtt, mbps, drop, fail: String(failRe), failLeft, stall: String(stallRe) })); return; }
    st.req++; st.byPath.set(path, (st.byPath.get(path) || 0) + 1);
    const parts = []; req.on('data', d => parts.push(d));
    await new Promise(r => req.on('end', r));
    const isApi = path.startsWith('/api/');
    if (stallRe && stallLeft > 0 && stallRe.test(path)) { stallLeft--; if (log) console.log('STALL', path); return; }   // (never answers: the socket stays open)
    if (failRe && failLeft > 0 && failRe.test(path) && req.method === 'GET') { failLeft--; st.drops++; if (log) console.log('FAIL', path); await wait(rtt); req.socket.destroy(); return; }
    if (!isApi && drop > 0 && Math.random() < drop && req.method === 'GET') { st.drops++; if (log) console.log('DROP', path); await wait(rtt); req.socket.destroy(); return; }
    let up;
    try { up = await fetchUp(req, Buffer.concat(parts)); } catch (e) { res.writeHead(502); res.end(String(e)); return; }
    const headers = { ...up.headers }; delete headers['content-length']; delete headers['transfer-encoding']; delete headers['content-encoding']; delete headers.connection;
    if (!isApi && up.status === 200 && req.method === 'GET') {
      const etag = '"' + createHash('sha1').update(up.body).digest('hex').slice(0, 20) + '"';
      headers.etag = etag; headers['cache-control'] = 'public, max-age=0, must-revalidate'; delete headers.pragma; delete headers.expires;
      if (req.headers['if-none-match'] === etag) { st.n304++; await send(res, 304, { etag, 'cache-control': headers['cache-control'] }, null); return; }
    }
    headers['content-length'] = up.body.length;
    await send(res, up.status, headers, up.body);
  });
  return new Promise(ok => server.listen(port, () => ok({
    port, close: () => new Promise(r => { server.closeAllConnections && server.closeAllConnections(); server.close(() => r()); }),
    switchTo: u => { upstream = u; }, set: o => { if (o.rtt != null) rtt = o.rtt; if (o.mbps != null) mbps = o.mbps; if (o.drop != null) drop = o.drop; if ('fail' in o) { failRe = o.fail ? new RegExp(o.fail) : null; failLeft = o.failN || 1; } if ('stall' in o) { stallRe = o.stall ? new RegExp(o.stall) : null; stallLeft = o.stallN == null ? Infinity : o.stallN; } },
    stats: () => ({ upstream, req: st.req, n304: st.n304, drops: st.drops, kb: Math.round(st.bytes / 1024) }),
  })));
}

if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}` || process.argv[1].endsWith('line-proxy.mjs')) {
  const a = process.argv.slice(2); const o = k => { const i = a.indexOf(`--${k}`); return i < 0 ? undefined : a[i + 1]; };
  const p = await startLine({ port: +(o('port') || 5181), to: o('to') || 'http://localhost:5173', rtt: +(o('rtt') || 40), mbps: +(o('mbps') || 40), drop: +(o('drop') || 0), log: a.includes('--log') });
  console.log(`THE LINE on :${p.port} → ${o('to') || 'http://localhost:5173'}`);
}
