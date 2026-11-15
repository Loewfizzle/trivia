// CITY E — THE TAPPABLE SHARE CARD (the owner, Nov 15): SHARE TODAY sends a LINK whose link-preview picture IS the day's scorecard.
// Served from the dailies' EXISTING function (api/daily.js — no new function, no rewrite in vercel.json, THE WRONG DOOR holds):
//   POST /api/daily { action: 'shareCard', day, games: [g…], png: <base64> }  → { code, url }   (at PREPARE time — never at the tap)
//   GET  /api/daily?s=<code>   → a small HTML page: og:title "<NAME> · <DAILY> · <day>", og:image = ?si=<code>, twitter summary_large_image,
//                                and a person sent straight on to the site's daily (/?daily=1); an unknown / expired code → the site's home
//   GET  /api/daily?si=<code>&v=<h>  → the PNG, with an hour's EDGE cache (s-maxage — FIXES R1 A5: a deleted card stops showing within the hour;
//                                the page's og:image carries the picture's hash `v`, so a changed card is a new picture URL)
// THE PICTURE = the card the phone already builds (js/daily/share.js#prepShare), at EXACTLY half its size (540 × 675 — the real numbers: the full
// 1080 × 1350 PNG is 365 KB – 1 MB, over the cap; the half is 79 – 246 KB). The server accepts it ONLY from a player with a JUDGED finish
// (dly/{g}/{day}/r/{pid}) of EVERY daily the card names that day; ONE card per player per day (SHARE TODAY makes one card for the day's
// dailies); a real PNG, ≤ MAX_BYTES. Stored SERVER-ONLY (top-level nodes the rules never open — the default deny): shr/{code} = { p: pid,
// d: day, g: [..], n: name, at, h: sha256, img: base64 } · shrx/{day}/{code} = pid (the sweep's index) · shrp/{pid}/{day} = code (THE SLOT).
// The code = a server-made random code (never a pid / key). Deleted after KEEP_DAYS — swept by THE DAY'S CLOSE (api/daily.js `start` / `today`
// — no new idle poll). /admin → THE DAILIES deletes one (api/admin.js).
// FIXES R1 (THE REVIEW A2 / A4 / A5):
//   ONE CARD A PLAYER A DAY holds under PARALLEL uploads — THE SLOT shrp/{pid}/{day} is claimed in a TRANSACTION (the first upload mints the
//   code, every other one — at once or later — gets the SAME code), and a player may upload SHARE_UPLOADS_A_DAY times a day (rl/shrup:{pid});
//   THE SAME DAY KEEPS ITS CODE: a re-share / re-upload of that day replaces the PICTURE under the same code (a link already sent keeps
//   working); the same bytes again (its sha256 `h`) write nothing;
//   THE PICTURE IS A WHOLE PNG: every chunk walked to IEND with its CRC, IHDR first, an IDAT, NOTHING after IEND (no payload served from our
//   domain); only a COUNTED finisher (no dly/{g}/{day}/x/{pid} — THE THROWAWAY GATE) may upload.
import { randomBytes, createHash } from 'node:crypto';
import { ref, val } from './fb.js';
import { ApiError } from './http.js';
import { dayNum, dayOf, streakDay } from '../../js/core/streak.js';
import { DAILIES } from '../../js/config.js';

export const CARD_W = 540, CARD_H = 675, MAX_BYTES = 400 * 1024, KEEP_DAYS = 7;
export const SHARE_UPLOADS_A_DAY = 6;   // (FIXES R1 A2 — a phone uploads only when its card changed: the day's finishes + a look turn ≈ 2–4)
const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
export const CODE_RE = /^[A-Za-z0-9_-]{12}$/;
const DAY_RE = /^d\d{8}$/;

/** a fresh share code: 9 random bytes, base64url → 12 characters (never derived from a pid, a key or a day) */
export const newCode = () => randomBytes(9).toString('base64url');

const CRC_T = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc32 = (buf, from, to) => { let c = 0xffffffff; for (let i = from; i < to; i++) c = CRC_T[(c ^ buf[i]) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };

/** the upload's bytes → ok | the reason it is refused (PURE — the tests feed it buffers). FIXES R1 A5: the WHOLE file must parse as a PNG —
 *  the signature, IHDR first (13 bytes, the card's exact size), every chunk's length inside the file + a 4-letter type + its CRC, at least one
 *  IDAT, and IEND ending EXACTLY at the last byte (a trailing payload behind a real picture is refused) */
export function checkPng(buf) {
  if (!Buffer.isBuffer(buf) || !buf.length) return 'no_image';
  if (buf.length > MAX_BYTES) return 'too_big';
  if (buf.length < 33 || PNG_MAGIC.some((b, i) => buf[i] !== b) || buf.toString('latin1', 12, 16) !== 'IHDR' || buf.readUInt32BE(8) !== 13) return 'not_png';
  if (buf.readUInt32BE(16) !== CARD_W || buf.readUInt32BE(20) !== CARD_H) return 'wrong_size';
  let at = 8, idat = false;
  while (at + 12 <= buf.length) {
    const len = buf.readUInt32BE(at), type = buf.toString('latin1', at + 4, at + 8), end = at + 12 + len;
    if (!/^[A-Za-z]{4}$/.test(type) || end > buf.length) return 'not_png';
    if (crc32(buf, at + 4, at + 8 + len) !== buf.readUInt32BE(at + 8 + len)) return 'not_png';
    if (type === 'IDAT') idat = true;
    if (type === 'IEND') return idat && len === 0 && end === buf.length ? null : 'not_png';
    at = end;
  }
  return 'not_png';
}
/** the picture's fingerprint (the same bytes again = nothing written; the page's og:image `v`) */
export const pngHash = buf => createHash('sha256').update(buf).digest('base64url').slice(0, 16);

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
export function sharePage({ code, name, games, day, base, v = '' }) {
  const title = [String(name || 'A PLAYER').toUpperCase(), dailyLabel(games), dayLabel(day)].filter(Boolean).join(' · ');
  const img = `${base}/api/daily?si=${code}${v ? `&v=${encodeURIComponent(v)}` : ''}`, go = '/?daily=1';
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

/** POST shareCard — the checks, then ONE card per player per day under ONE code (THE SLOT, a transaction) → { code, same? } */
export async function saveShareCard({ pid, day, games, png, now = Date.now(), takeFn }) {
  const today = streakDay(now);
  if (!DAY_RE.test(String(day || '')) || (day !== today && day !== dayOf(dayNum(today) - 1))) throw new ApiError(400, 'bad_day', 'That day isn’t open.');
  const gs = [...new Set((Array.isArray(games) ? games : []).filter(g => typeof g === 'string' && DAILIES.some(r => r.id === g)))].slice(0, 6);
  if (!gs.length) throw new ApiError(400, 'bad_game', 'Which daily?');
  if (typeof png !== 'string' || png.length > Math.ceil(MAX_BYTES / 3) * 4 + 8) throw new ApiError(413, 'too_big', 'The picture is too big.');
  const buf = Buffer.from(png, 'base64');
  const bad = checkPng(buf);
  if (bad) throw new ApiError(bad === 'too_big' ? 413 : 422, bad, 'That isn’t the day’s card.');
  // a JUDGED finish of every daily the card names, that day (the server's own result — dly/{g}/{day}/r/{pid})
  const [done, gated] = await Promise.all([Promise.all(gs.map(g => val(`dly/${g}/${day}/r/${pid}`))), Promise.all(gs.map(g => val(`dly/${g}/${day}/x/${pid}`)))]);
  if (done.some(r => r == null)) throw new ApiError(403, 'no_finish', 'Finish today’s daily first.');
  // (FIXES R1 A5 — THE THROWAWAY GATE: a result that doesn't count — a same-day account — shares the picture itself, never a link of ours)
  if (gated.some(x => x != null)) throw new ApiError(403, 'not_counted', 'Your link card comes with your first counted daily.');
  const h = pngHash(buf);
  // THE SLOT (FIXES R1 A2): the day's code claimed ONCE — the first upload mints it, every other (in parallel or later) gets the same one back
  const slot = await ref(`shrp/${pid}/${day}`).transaction(cur => (typeof cur === 'string' && CODE_RE.test(cur) ? undefined : newCode()));
  const code = slot.snapshot.val();
  if (!CODE_RE.test(String(code || ''))) throw new ApiError(503, 'busy', 'Try again in a moment.');
  // the same picture again (a reload, a second phone) → nothing written, nothing counted
  if ((await val(`shr/${code}/h`)) === h) return { code, v: h, same: true };
  // a few uploads a player a day (a phone re-uploads only when its card changed — js/daily/share.js)
  const { take } = takeFn ? { take: takeFn } : await import('./limit.js');
  if (!(await take(`shrup:${pid}:${day}`, SHARE_UPLOADS_A_DAY, 864e5, now))) throw new ApiError(429, 'share_limit', 'That’s enough cards for today.');
  const prof = await val(`profiles/${pid}`);
  const { publicName } = await import('./lb.js');
  const name = publicName((prof && prof.bid) || pid, prof && prof.n);
  // (the same code: the picture replaced in place — a link already sent keeps working; set, never merged: no stale field survives)
  await ref().update({
    [`shr/${code}`]: { p: pid, d: day, g: gs, n: String(name || '').slice(0, 24), at: now, h, img: buf.toString('base64') },
    [`shrx/${day}/${code}`]: pid,
  });
  return { code, v: h };
}

/** the stored card (the picture or only its words) — null when gone / expired */
export async function readShare(code, { img = false, now = Date.now() } = {}) {
  if (!CODE_RE.test(String(code || ''))) return null;
  const r = img ? await val(`shr/${code}`) : await Promise.all(['p', 'd', 'g', 'n', 'at', 'h'].map(k => val(`shr/${code}/${k}`))).then(([p, d, g, n, at, h]) => (p ? { p, d, g, n, at, h } : null));
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
