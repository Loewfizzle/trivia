// GET /api/time → { t } — the server's clock (ms), never cached. APP FIXES (Grok 3.1): THE TITLE PARKS THE DATABASE (no socket, so no
// .info/serverTimeOffset) — a phone that never opened a room sat at offset 0 (its own clock), so two phones on the same RADIO STATION
// could be seconds apart. js/firebase.js#syncTimeNoSocket samples this twice (the shortest round trip wins; core/sync-math.js) once
// a visible session + on return from the background. No imports: a cold start is a few ms.
// LOAD FIX 4 — THE SKEW WRAPPER: `v` = the deploy's commit (Vercel's own env; none locally) — a page compares the first `v` it got with the
// live one when a lazy import fails to link (js/ui/lazy-import.js): changed = another deploy's files → ONE reload.
const V = String(process.env.VERCEL_GIT_COMMIT_SHA || '').slice(0, 12);
export default function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.statusCode = 405; res.end('{"error":"GET only"}'); return; }
  res.statusCode = 200;
  res.end(JSON.stringify(V ? { t: Date.now(), v: V } : { t: Date.now() }));
}
