// PULSE song assets: manifest, beat maps, audio. Audio is fetched as bytes early (lobby / load phase)
// and decoded into an AudioBuffer once (decoding needs no unlocked context). Only the current song's
// buffer is kept — a decoded 3-minute mono song is ~30 MB.
const base = new URL('../../../', import.meta.url);
let manifest = null;
const maps = new Map();
const bytes = new Map();
let decoded = { id: null, buffer: null, p: null };

export function loadManifest() {
  if (!manifest) manifest = fetch(new URL('data/pulse/manifest.json', base)).then(r => r.json()).then(m => m.songs).catch(e => { manifest = null; throw e; });
  return manifest;
}

export function loadMap(id) {
  if (!maps.has(id)) maps.set(id, fetch(new URL(`data/pulse/${id}.json`, base)).then(r => r.json()).catch(e => { maps.delete(id); throw e; }));
  return maps.get(id);
}

/** Starts downloading a song's audio (no decode). Cheap to call repeatedly. */
export function prefetchSong(id) {
  if (!bytes.has(id)) bytes.set(id, fetch(new URL(`audio/pulse/${id}.mp3`, base)).then(r => { if (!r.ok) throw new Error(`audio ${r.status}`); return r.arrayBuffer(); }).catch(e => { bytes.delete(id); throw e; }));
  return bytes.get(id);
}

/** Decoded AudioBuffer for a song (cached for the current song only). */
export function songBuffer(id) {
  if (decoded.id === id && decoded.p) return decoded.p;
  const p = prefetchSong(id).then(ab => {
    const AC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    const ctx = new AC(1, 1, 44100);
    return new Promise((resolve, reject) => ctx.decodeAudioData(ab.slice(0), resolve, reject));
  });
  decoded = { id, buffer: null, p: p.then(b => { decoded.buffer = b; return b; }) };
  decoded.p.catch(() => { if (decoded.p === p) decoded = { id: null, buffer: null, p: null }; });
  return decoded.p;
}

export function dropOtherSongs(keep) {
  for (const id of [...bytes.keys()]) if (!keep.includes(id)) bytes.delete(id);
}
