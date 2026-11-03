// CITY CONTROLS B — THE INTERCOM (the owner, Oct 28 "SPEAK TO THE CITY" + Nov 2 — DECIDED; docs/harbor/passes/city-controls-b.md). PURE: the
// server (api/_lib/radio.js#intercom) and the phones (audio/intercom.js, screens/harbor/radio-intercom.js) share it — the server checks every
// send with these same rules; a phone only decides WHEN to play what it was told.
//   THE CLIP      the owner's phone records it (MediaRecorder: AAC in MP4 on an iPhone, Opus elsewhere), ≤ `maxS` s at ~`kbps`; SEND posts
//                 it to /api (base64), the server keeps it `keep` s (radio/clips/{id}) and serves it through a cached GET (?clip=<id>)
//   AUDIENCES     the knob's three: JUST ME (his phone) · LOBBY ONLY (one lobby: its node, on the room's socket) · EVERYONE (the city's cached
//                 feed + every open lobby's node)
//   WAIT          WAIT FOR THE LOBBY (default): a phone in a running game holds it until it's back in the lobby / the title (≤ `keep`);
//                 DON'T WAIT: it plays at once over the game (its music ducked) — a game that exports NO_INTERCOM still holds it
//   TOGETHER      a lobby's phones start it at ONE moment on the server clock (`at`); a late lobby phone skips it (unless it was holding it)
//   THE HEADLINE  ON THE BILLBOARD: ≤ `head` letters (the radio's word rules: the profanity filter, BNAME) on the speakeasy's billboard while
//                 the voice plays (two lines of ≤ 12 — the board's own)
import { knob } from './harbor-schedule.js';
import { cleanWords, WORDS_WHY } from './harbor-radio.js';

export const IC_AUD = Object.freeze(['me', 'room', 'everyone']);
/** the chime's length (s — 419491 whole) + the gaps around the voice: chime · 0.3 · voice · 0.35 · chime */
export const CHIME_S = 2.66, GAP_IN = 0.3, GAP_OUT = 0.35;
const MIME_RE = /^audio\/(mp4|webm|ogg|mpeg|aac|x-m4a)(;[ a-z0-9=.,"-]*)?$/i;
const B64_RE = /^[A-Za-z0-9+/]+={0,2}$/;

/** the whole announcement's length (s): the chime, the voice, the chime */
export const icLen = dur => CHIME_S + GAP_IN + Math.max(0, Number(dur) || 0) + GAP_OUT + CHIME_S;

/** the headline → { text, bad } (empty = none: { text: '', bad: null }) — the radio's word rules, ≤ `head` letters */
export function cleanHead(raw, o = {}) {
  const t = String(raw == null ? '' : raw).trim();
  if (!t) return { text: '', bad: null };
  return cleanWords(t, { max: knob('radio.intercom').head, names: o.names });
}
/** THE WHEN (the owner's PROGRESSION A review, Nov 2 8:46 pm): NOW · IN 10 MIN · AT A TIME (up to a day ahead) */
export const IC_WHEN = Object.freeze(['now', 'in10', 'at']);
export const IC_IN10_MS = 10 * 60e3, IC_AHEAD_MS = 24 * 3600e3;
/** a scheduled send's start (ms) or null (NOW) — o.now: the server's clock; bad: 'bad_time' (in the past / more than a day ahead) */
export function icWhen(body = {}, now = Date.now()) {
  const w = IC_WHEN.includes(body.when) ? body.when : 'now';
  if (w === 'now') return { at: null, bad: null };
  if (w === 'in10') return { at: now + IC_IN10_MS, bad: null };
  const at = Math.round(Number(body.at));
  if (!Number.isFinite(at) || at < now + 30e3 || at > now + IC_AHEAD_MS + 60e3) return { at: null, bad: 'bad_time' };
  return { at, bad: null };
}
/** a send's body → { req: { aud, room, wait, head, mime, dur, b64, bytes }, bad } (the server's whitelist; the phone checks the same) */
export function cleanIntercom(body = {}, o = {}) {
  const K = knob('radio.intercom');
  const aud = IC_AUD.includes(body.aud) ? body.aud : null;
  if (!aud) return { req: null, bad: 'bad_audience' };
  const room = aud === 'room' ? String(body.room || '').toUpperCase() : null;
  if (aud === 'room' && !/^[A-Z]{4}$/.test(room)) return { req: null, bad: 'bad_room' };
  const mime = String(body.mime || '');
  if (!MIME_RE.test(mime) || mime.length > 64) return { req: null, bad: 'bad_mime' };
  const dur = Number(body.dur);
  if (!Number.isFinite(dur) || dur < K.minS || dur > K.maxS + 1) return { req: null, bad: 'bad_length' };
  const b64 = typeof body.b64 === 'string' ? body.b64 : '';
  const bytes = Math.floor(b64.length * 3 / 4) - (b64.endsWith('==') ? 2 : b64.endsWith('=') ? 1 : 0);
  if (!b64 || !B64_RE.test(b64) || bytes < 200) return { req: null, bad: 'bad_clip' };
  if (bytes > K.maxKB * 1024) return { req: null, bad: 'clip_too_big' };
  const h = cleanHead(body.head, { names: o.names });
  if (h.bad) return { req: null, bad: `words_${h.bad}` };
  return { req: { aud, room, wait: body.wait !== false, head: h.text || null, mime: mime.toLowerCase(), dur: Math.round(dur * 100) / 100, b64, bytes }, bad: null };
}
export const IC_WHY = Object.freeze({ bad_time: 'Pick a time in the next 24 hours.', bad_audience: 'Pick who hears it.', bad_room: 'Pick a lobby first.', bad_mime: 'This phone recorded a format the city can’t play.', bad_length: 'Too short or too long.', bad_clip: 'The recording is empty.', clip_too_big: 'The recording is too big — keep it under 30 seconds.', ...Object.fromEntries(Object.entries(WORDS_WHY).map(([k, v]) => [`words_${k}`, v])) });

/** the headline's two board lines (≤ 12 letters each — word-wrapped; a long word split) */
export function headLines(text, max = 12) {
  const words = String(text || '').trim().split(/\s+/).filter(Boolean), out = [''];
  for (let w of words) {
    while (w.length > max) { if (out[out.length - 1]) out.push(''); out[out.length - 1] = w.slice(0, max); w = w.slice(max); out.push(''); }
    const cur = out[out.length - 1];
    if (!cur) out[out.length - 1] = w; else if (cur.length + 1 + w.length <= max) out[out.length - 1] = `${cur} ${w}`; else out.push(w);
  }
  const L = out.filter(Boolean);
  return [L[0] || '', L.slice(1).join(' ').slice(0, max)];
}
/** a SUGGESTED headline from the browser's own transcript (where it has one): upper-case, the allowed letters, cut at a word ≤ `head` */
export function suggestHead(transcript) {
  const max = knob('radio.intercom').head;
  const t = String(transcript || '').toUpperCase().replace(/[‘’]/g, "'").replace(/[^A-Z0-9 .,!?'&+#:\-]/g, ' ').replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max + 1), sp = cut.lastIndexOf(' ');
  return (sp > 6 ? cut.slice(0, sp) : t.slice(0, max)).trim();
}

/** the public copy of an intercom moment (no profile id, no role): what a phone needs to play it */
export function icPublic(id, m) {
  return { id, kind: 'intercom', at: m.at, until: m.until, made: m.made, aud: m.aud, room: m.room || null, wait: m.wait !== false, head: m.head || null, dur: m.dur, mime: m.mime, state: m.state || 'q' };
}

/**
 * WHEN does this phone play it? m: the public moment; ctx: { now (server ms), source ('desk' — the owner's own phone · 'room' — a lobby's
 * node · 'feed' — the city's cached GET), inGame (this phone's room has a game running), holdGame (the game exports NO_INTERCOM — it
 * holds even a DON'T WAIT), busy (a legendary's own audio is on — wait for it), held (this phone held it while in a game) }
 * → 'play' · 'wait' (not yet — ask again) · 'hold' (in a game: until the lobby / the title) · 'skip' (never)
 */
export function icDecide(m, ctx) {
  const K = knob('radio.intercom'), now = ctx.now;
  if (!m || m.state === 'stopped') return 'skip';
  if (now > Math.max(m.made || 0, m.at || 0) + K.keep * 1000) return 'skip';   // (a scheduled one keeps its hour from its own start)
  if (now < m.at) return 'wait';
  if (ctx.inGame && (m.wait !== false || ctx.holdGame)) return 'hold';
  if (ctx.busy) return 'wait';
  if (ctx.held) return 'play';
  if (ctx.source === 'desk') return now <= m.until + K.late * 1000 ? 'play' : 'skip';
  // a lobby's phones start TOGETHER: a phone more than a few seconds late skips it (it wasn't holding it)
  if (ctx.source === 'room') return now <= m.at + 4000 ? 'play' : 'skip';
  // the city's feed arrives up to ~45 s late (the cached poll): a title phone still plays one that just went out
  return now <= m.until + K.late * 1000 ? 'play' : 'skip';
}
/** may the owner still UNSEND it? (the button stays until every phone would have it: `unsend` s after it went out) */
export const canUnsend = (m, now) => { if (!m || m.state === 'stopped') return false; const base = (m.at || 0) - (m.made || 0) > 60e3 ? m.at : (m.made || 0); return now < base + knob('radio.intercom').unsend * 1000; };   // (a scheduled one: until it plays + the same minute)
