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
import { readFileSync } from 'node:fs';

/** vercel.json's header rules that set Cache-Control → [{ re, value }] (Vercel's `source` → a RegExp: `(.*)` as is, the rest literal) */
export function vercelCacheRules(file = new URL('../../../vercel.json', import.meta.url)) {
  const cfg = JSON.parse(readFileSync(file, 'utf8'));
  return (cfg.headers || []).flatMap(r => {
    const h = (r.headers || []).find(x => x.key.toLowerCase() === 'cache-control');
    if (!h) return [];
    const re = new RegExp('^' + r.source.split('(.*)').map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('(.*)') + '$');
    return [{ re, value: h.value }];
  });
}
/** the Cache-Control Vercel sends for a path (the first rule that names one), else null */
export const cacheFor = (rules, path) => { const r = rules.find(x => x.re.test(path)); return r ? r.value : null; };

export function startLine({ port = 5181, to = 'http://localhost:5173', rtt = 40, mbps = 40, drop = 0, log = false, fail = null, failN = 1, stall = null, stallN = Infinity, mangle = null, prod = false, build = null } = {}) {
  // (FR7 FIXES B — THE EDGE CACHE: prod = Vercel's OWN Cache-Control per path from vercel.json's header rules (the static default
  //  `public, max-age=0, must-revalidate` where no rule names one) — a browser then keeps /js /css /assets for 5 min like a phone does;
  //  build = the deploy's build id the line adds to /api/time's answer (`v`, as Vercel's VERCEL_GIT_COMMIT_SHA) — set({ build }) = A DEPLOY)
  let prodRules = prod ? vercelCacheRules() : null, buildId = build;
  // (mangle: { re, from, to, n } — the first n answers for a path matching re have `from` replaced by `to`: ANOTHER DEPLOY's copy of a file —
  //  e.g. an export renamed, so its importers fail to link: THE VERSION SKEW)
  let mg = mangle ? { ...mangle, re: new RegExp(mangle.re), n: mangle.n == null ? 1 : mangle.n } : null;
  let upstream = to;
  // (fail: a RegExp — the first failN requests whose path matches are dropped, then it answers; stall: a RegExp — those never answer)
  let failRe = fail ? new RegExp(fail) : null, failLeft = failN, stallRe = stall ? new RegExp(stall) : null, stallLeft = stallN;
  const st = { req: 0, n304: 0, drops: 0, bytes: 0, byPath: new Map(), ruled: 0, switchedAt: null, edge: 0, api: 0 };
  let rules = [], switchOn = null;   // (LOAD FIX 4: deploy B's file rules + the switch armed on a request — set({ rules, switchOn }))
  const rx = o => ({ ...o, re: new RegExp(o.re) });
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
    // (LOAD FIX 4 — THE DEPLOY LANDS ON A REQUEST: the first request matching switchOn.re moves the upstream + turns B's rules on BEFORE it is
    //  answered — "the deploy happened right before this lazy import")
    if (switchOn && switchOn.re.test(path)) { upstream = switchOn.to; rules = switchOn.rules || []; st.switchedAt = path; switchOn = null; if (log) console.log('SWITCH on', path); }
    const parts = []; req.on('data', d => parts.push(d));
    await new Promise(r => req.on('end', r));
    const isApi = path.startsWith('/api/');
    st.edge++; if (isApi) st.api++;
    if (stallRe && stallLeft > 0 && stallRe.test(path)) { stallLeft--; if (log) console.log('STALL', path); return; }   // (never answers: the socket stays open)
    if (failRe && failLeft > 0 && failRe.test(path) && req.method === 'GET') { failLeft--; st.drops++; if (log) console.log('FAIL', path); await wait(rtt); req.socket.destroy(); return; }
    if (!isApi && drop > 0 && Math.random() < drop && req.method === 'GET') { st.drops++; if (log) console.log('DROP', path); await wait(rtt); req.socket.destroy(); return; }
    let up;
    try { up = await fetchUp(req, Buffer.concat(parts)); } catch (e) { res.writeHead(502); res.end(String(e)); return; }
    const headers = { ...up.headers }; delete headers['content-length']; delete headers['transfer-encoding']; delete headers['content-encoding']; delete headers.connection;
    if (mg && mg.n > 0 && up.status === 200 && mg.re.test(path)) { mg.n--; up.body = Buffer.from(up.body.toString('utf8').split(mg.from).join(mg.to)); if (log) console.log('MANGLE', path); }
    // (LOAD FIX 4 — DEPLOY B's files: every answer matching a rule, while the rules are on — { re, prepend } or { re, from, to })
    if (up.status === 200) for (const r of rules) if (r.re.test(path) && r.n !== 0) { if (r.n > 0) r.n--; const t = up.body.toString('utf8'); up.body = Buffer.from(r.prepend != null ? r.prepend + t : t.split(r.from).join(r.to)); st.ruled++; }
    if (!isApi && up.status === 200 && req.method === 'GET') {
      const etag = '"' + createHash('sha1').update(up.body).digest('hex').slice(0, 20) + '"';
      headers.etag = etag; headers['cache-control'] = (prodRules && cacheFor(prodRules, path)) || 'public, max-age=0, must-revalidate'; delete headers.pragma; delete headers.expires;
      if (req.headers['if-none-match'] === etag) { st.n304++; await send(res, 304, { etag, 'cache-control': headers['cache-control'] }, null); return; }
    }
    if (path === '/api/time' && buildId && up.status === 200) { try { const j = JSON.parse(up.body.toString('utf8')); j.v = buildId; up.body = Buffer.from(JSON.stringify(j)); } catch { /* as it came */ } }
    headers['content-length'] = up.body.length;
    await send(res, up.status, headers, up.body);
  });
  return new Promise(ok => server.listen(port, () => ok({
    port, close: () => new Promise(r => { server.closeAllConnections && server.closeAllConnections(); server.close(() => r()); }),
    switchTo: u => { upstream = u; }, set: o => { if (o.rtt != null) rtt = o.rtt; if (o.mbps != null) mbps = o.mbps; if (o.drop != null) drop = o.drop; if ('fail' in o) { failRe = o.fail ? new RegExp(o.fail) : null; failLeft = o.failN || 1; } if ('mangle' in o) mg = o.mangle ? { ...o.mangle, re: new RegExp(o.mangle.re), n: o.mangle.n == null ? 1 : o.mangle.n } : null; if ('stall' in o) { stallRe = o.stall ? new RegExp(o.stall) : null; stallLeft = o.stallN == null ? Infinity : o.stallN; }
      if ('rules' in o) rules = (o.rules || []).map(rx); if ('build' in o) buildId = o.build; if ('prod' in o) prodRules = o.prod ? vercelCacheRules() : null; if ('switchOn' in o) switchOn = o.switchOn ? { ...o.switchOn, re: new RegExp(o.switchOn.re), rules: (o.switchOn.rules || []).map(rx) } : null; },
    stats: () => ({ upstream, req: st.req, n304: st.n304, drops: st.drops, kb: Math.round(st.bytes / 1024), ruled: st.ruled, switchedAt: st.switchedAt, edge: st.edge, api: st.api }),
  })));
}

if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}` || process.argv[1].endsWith('line-proxy.mjs')) {
  const a = process.argv.slice(2); const o = k => { const i = a.indexOf(`--${k}`); return i < 0 ? undefined : a[i + 1]; };
  const p = await startLine({ port: +(o('port') || 5181), to: o('to') || 'http://localhost:5173', rtt: +(o('rtt') || 40), mbps: +(o('mbps') || 40), drop: +(o('drop') || 0), log: a.includes('--log') });
  console.log(`THE LINE on :${p.port} → ${o('to') || 'http://localhost:5173'}`);
}
