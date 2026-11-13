// FR7 FIXES C — THE LEDGER's NOW PLAYING (the owner, Nov 13: "the song this phone is playing — the file names are fine, no titles yet"): what THIS
// phone is sounding right now, read from the audio engine's OWN state (no poll, no /api call) — a room's lobby song (audio/lobby-music.js) wins,
// then the city's station / the party deck (audio/party-music.js — the server clock), else the plain player (audio/music.js).
// FR7 FIXES C2 — THE LEDGER WOULDN'T OPEN (the owner's iPhone, Nov 13 7 am: "Tuning in…" forever): this file USED to import the three players
// to read them, which pulled them into the LEDGER's lazy chunk. A phone whose page held an OLDER music.js (a cached copy from the deploy before —
// the edge header's stale-while-revalidate) then linked the new file against it: "Importing binding name 'musicFileOf' is not found" — the whole
// LEDGER failed to import, and radio.js swallowed it. Now this file IMPORTS NOTHING: each player registers its own reader on ONE shared hub when
// it loads (`globalThis.__nsNowPlaying` — { off, lobby, party, music }, each () → { source, file, left } | null); a player that never registered
// (an older copy) = no answer → "NOW PLAYING · —". Nothing here can stop the LEDGER from painting (tests/now-playing.test.mjs + the harbor `radio`
// group's FACES PAINT check, which a stale music.js used to fail in WebKit).
export const NP_HUB = '__nsNowPlaying';

/** the shared hub (created on first ask) — the players call this at load: `nowPlayingHub().music = () => …` */
export function nowPlayingHub() {
  const g = typeof globalThis !== 'undefined' ? globalThis : {};
  return g[NP_HUB] || (g[NP_HUB] = {});
}

/** PURE over the hub → { off: true } (MUSIC OFF) | { source, file, left (s | null) } | { idle: true } | { unknown: true } (no player registered) */
export function nowPlayingNow(hub = (typeof globalThis !== 'undefined' ? globalThis[NP_HUB] : null)) {
  const H = hub && typeof hub === 'object' ? hub : {};
  const ask = k => { try { return typeof H[k] === 'function' ? H[k]() : null; } catch { return null; } };
  if (!['off', 'lobby', 'party', 'music'].some(k => typeof H[k] === 'function')) return { unknown: true };
  if (ask('off')) return { off: true };
  for (const k of ['lobby', 'party', 'music']) {
    const r = ask(k);
    if (r && r.file) return { source: String(r.source || 'MUSIC'), file: String(r.file), left: Number.isFinite(r.left) ? Math.max(0, r.left) : null };
  }
  return { idle: true };
}

/** m:ss */
export const mss = s => { const t = Math.max(0, Math.round(Number(s) || 0)); return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`; };
/** a file name from a URL (no query, no path) */
export const fileBase = u => String(u || '').split('?')[0].split('/').pop() || null;
/** the one line THE LEDGER shows: NOW PLAYING · <source> · <file> · m:ss left  |  MUSIC OFF  |  nothing sounding  |  — (never throws) */
export function nowPlayingText(n) {
  try {
    if (n === undefined) n = nowPlayingNow();
    if (!n || n.unknown) return 'NOW PLAYING · —';
    if (n.off) return 'NOW PLAYING · MUSIC OFF';
    if (n.idle) return 'NOW PLAYING · nothing sounding yet (tap the city to start the music)';
    return `NOW PLAYING · ${n.source} · ${n.file || '?'}${n.left != null ? ` · ${mss(n.left)} left` : ''}`;
  } catch { return 'NOW PLAYING · —'; }
}
