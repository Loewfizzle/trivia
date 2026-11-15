// CITY E — THE TAPPABLE SHARE CARD (the owner, Nov 15): SHARE TODAY sends a LINK whose link-preview picture IS the day's scorecard.
// Served from the dailies' EXISTING function (api/daily.js — no new function, no rewrite in vercel.json, THE WRONG DOOR holds):
//   POST /api/daily { action: 'shareCard', day, games: [g…], png: <base64> }  → { code, url }   (at PREPARE time — never at the tap)
//   GET  /api/daily?s=<code>   → a small HTML page: og:title "<NAME> · <DAILY> · <day>", og:image = ?si=<code>, twitter summary_large_image,
//                                and a person sent straight on to the site's daily (/?daily=1); an unknown / expired code → the site's home
//   GET  /api/daily?si=<code>  → the PNG, with a long EDGE cache (s-maxage) — repeated preview fetches hit the CDN, not the database
// THE PICTURE = the card the phone already builds (js/daily/share.js#prepShare), at EXACTLY half its size (540 × 675 — the real numbers: the full
// 1080 × 1350 PNG is 365 KB – 1 MB, over the cap; the half is 79 – 246 KB). The server accepts it ONLY from a player with a JUDGED finish
// (dly/{g}/{day}/r/{pid}) of EVERY daily the card names that day; ONE card per player per day (SHARE TODAY makes one card for the day's
// dailies — a re-share replaces it); a real PNG (its magic bytes + its IHDR size), ≤ MAX_BYTES. Stored SERVER-ONLY (top-level nodes the rules
// never open — the default deny): shr/{code} = { p: pid, d: day, g: [..], n: name, at, img: base64 } · shrx/{day}/{code} = pid (the sweep's
// index) · shrp/{pid}/{day} = code (the replace). The code = a server-made random code (never a pid / key). Deleted after KEEP_DAYS — swept by
// THE DAY'S CLOSE (api/daily.js `start` / `today` — no new idle poll). /admin → THE DAILIES deletes one (api/admin.js).
import { randomBytes } from 'node:crypto';
import { ref, val } from './fb.js';
import { ApiError } from './http.js';
import { dayNum, dayOf, streakDay } from '../../js/core/streak.js';
import { DAILIES } from '../../js/config.js';

export const CARD_W = 540, CARD_H = 675, MAX_BYTES = 400 * 1024, KEEP_DAYS = 7;
const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
export const CODE_RE = /^[A-Za-z0-9_-]{12}$/;
const DAY_RE = /^d\d{8}$/;

/** a fresh share code: 9 random bytes, base64url → 12 characters (never derived from a pid, a key or a day) */
export const newCode = () => randomBytes(9).toString('base64url');

/** the upload's bytes → ok | the reason it is refused (PURE — the tests feed it buffers) */
export function checkPng(buf) {
  if (!Buffer.isBuffer(buf) || !buf.length) return 'no_image';
  if (buf.length > MAX_BYTES) return 'too_big';
  if (buf.length < 33 || PNG_MAGIC.some((b, i) => buf[i] !== b) || buf.toString('latin1', 12, 16) !== 'IHDR') return 'not_png';
  if (buf.readUInt32BE(16) !== CARD_W || buf.readUInt32BE(20) !== CARD_H) return 'wrong_size';
  return null;
}

/** a day key → "Nov 15" */
export function dayLabel(day) {
  if (!DAY_RE.test(String(day))) return '';
  const d = new Date(dayNum(day) * 864e5);
  return `${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getUTCMonth()]} ${d.getUTCDate()}`;
}
/** the daily part of the title: ONE daily's own name, or THE DAILIES for a card of several */
export function dailyLabel(games) {
  const gs = Array.isArray(games) ? games : [];
  if (gs.length !== 1) return 'THE DAILIES';
  const row = DAILIES.find(r => r.id === gs[0]);
  return row ? String(row.name).toUpperCase() : 'THE DAILIES';
}
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));

/** the link-preview page (PURE) — `base` = https://<host> of this request */
export function sharePage({ code, name, games, day, base }) {
  const title = [String(name || 'A PLAYER').toUpperCase(), dailyLabel(games), dayLabel(day)].filter(Boolean).join(' · ');
  const img = `${base}/api/daily?si=${code}`, go = '/?daily=1';
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)} — NEON SPEAKEASY</title>
<meta property="og:type" content="website"><meta property="og:site_name" content="Neon Speakeasy">
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="Today's dailies at the Neon Speakeasy — can you beat it?">
<meta property="og:url" content="${esc(`${base}/api/daily?s=${code}`)}">
<meta property="og:image" content="${esc(img)}"><meta property="og:image:type" content="image/png"><meta property="og:image:width" content="${CARD_W}"><meta property="og:image:height" content="${CARD_H}">
<meta property="og:image:alt" content="${esc(title)} — the day's scorecard">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:image" content="${esc(img)}">
<meta http-equiv="refresh" content="0; url=${go}">
<style>html,body{margin:0;background:#07050f;color:#f4f6ff;font:16px system-ui}a{color:#ff8fe0}p{padding:24px}</style>
</head><body><p><a href="${go}">Play today's dailies at the Neon Speakeasy</a></p><script>location.replace(${JSON.stringify(go)})</script></body></html>`;
}

/** POST shareCard — the checks, then ONE card per player per day (an earlier one replaced) → { code } */
export async function saveShareCard({ pid, day, games, png, now = Date.now() }) {
  const today = streakDay(now);
  if (!DAY_RE.test(String(day || '')) || (day !== today && day !== dayOf(dayNum(today) - 1))) throw new ApiError(400, 'bad_day', 'That day isn’t open.');
  const gs = [...new Set((Array.isArray(games) ? games : []).filter(g => typeof g === 'string' && DAILIES.some(r => r.id === g)))].slice(0, 6);
  if (!gs.length) throw new ApiError(400, 'bad_game', 'Which daily?');
  if (typeof png !== 'string' || png.length > Math.ceil(MAX_BYTES / 3) * 4 + 8) throw new ApiError(413, 'too_big', 'The picture is too big.');
  const buf = Buffer.from(png, 'base64');
  const bad = checkPng(buf);
  if (bad) throw new ApiError(bad === 'too_big' ? 413 : 422, bad, 'That isn’t the day’s card.');
  // a JUDGED finish of every daily the card names, that day (the server's own result — dly/{g}/{day}/r/{pid})
  const done = await Promise.all(gs.map(g => val(`dly/${g}/${day}/r/${pid}`)));
  if (done.some(r => r == null)) throw new ApiError(403, 'no_finish', 'Finish today’s daily first.');
  const [prof, old] = await Promise.all([val(`profiles/${pid}`), val(`shrp/${pid}/${day}`)]);
  const { publicName } = await import('./lb.js');
  const name = publicName((prof && prof.bid) || pid, prof && prof.n);
  const code = newCode();
  const up = {
    [`shr/${code}`]: { p: pid, d: day, g: gs, n: String(name || '').slice(0, 24), at: now, img: buf.toString('base64') },
    [`shrx/${day}/${code}`]: pid,
    [`shrp/${pid}/${day}`]: code,
  };
  if (typeof old === 'string' && CODE_RE.test(old) && old !== code) { up[`shr/${old}`] = null; up[`shrx/${day}/${old}`] = null; }   // (a re-share replaces it)
  await ref().update(up);
  return { code };
}

/** the stored card (the picture or only its words) — null when gone / expired */
export async function readShare(code, { img = false, now = Date.now() } = {}) {
  if (!CODE_RE.test(String(code || ''))) return null;
  const r = img ? await val(`shr/${code}`) : await Promise.all(['p', 'd', 'g', 'n', 'at'].map(k => val(`shr/${code}/${k}`))).then(([p, d, g, n, at]) => (p ? { p, d, g, n, at } : null));
  if (!r || !r.p) return null;
  if (now - Number(r.at || 0) > KEEP_DAYS * 864e5) return null;
  return r;
}

/** delete ONE card (the owner's /admin row, or the sweep) */
export async function deleteShare(code) {
  if (!CODE_RE.test(String(code || ''))) throw new ApiError(400, 'bad_code', 'That isn’t a share code.');
  const [p, d] = await Promise.all([val(`shr/${code}/p`), val(`shr/${code}/d`)]);
  if (!p) return { gone: false };
  const up = { [`shr/${code}`]: null };
  if (d) { up[`shrx/${d}/${code}`] = null; if ((await val(`shrp/${p}/${d}`)) === code) up[`shrp/${p}/${d}`] = null; }
  await ref().update(up);
  return { gone: true };
}

/** THE SWEEP (THE DAY'S CLOSE — once a day per warm function): every card older than KEEP_DAYS days, by its day's index (never a scan of the
 *  pictures) → the number removed */
const SWEPT = new Set();
export const forgetShareSweep = () => SWEPT.clear();
export async function sweepShares({ now = Date.now() } = {}) {
  const today = streakDay(now);
  if (SWEPT.has(today)) return 0;
  const last = dayOf(dayNum(today) - KEEP_DAYS);   // (days up to here are KEEP_DAYS + old: gone)
  const old = (await ref('shrx').orderByKey().endAt(last).limitToFirst(40).once('value')).val() || {};
  const up = {};
  let n = 0;
  for (const [day, codes] of Object.entries(old)) {
    up[`shrx/${day}`] = null;
    for (const [code, pid] of Object.entries(codes || {})) { up[`shr/${code}`] = null; if (typeof pid === 'string') up[`shrp/${pid}/${day}`] = null; n++; }
  }
  if (Object.keys(up).length) await ref().update(up);
  SWEPT.add(today);
  return n;
}

/** /admin → THE DAILIES: the live cards, newest first (their words only — never the pictures) */
export async function listShares({ limit = 20 } = {}) {
  const idx = (await ref('shrx').orderByKey().limitToLast(KEEP_DAYS + 1).once('value')).val() || {};
  const codes = Object.entries(idx).reverse().flatMap(([day, cs]) => Object.keys(cs || {}).map(code => ({ code, day }))).slice(0, limit);
  const rows = await Promise.all(codes.map(async ({ code, day }) => { const [n, g, at] = await Promise.all([val(`shr/${code}/n`), val(`shr/${code}/g`), val(`shr/${code}/at`)]); return { code, day, n, g, at }; }));
  return rows.filter(r => r.at).sort((a, b) => b.at - a.at);
}
