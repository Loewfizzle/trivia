// THE ALBUM (PROGRESSION B — CITY SIGHTINGS): the player's own polaroids, ON THIS DEVICE (IndexedDB — the decision: the photo stays on the
// phone, the SIGHTING RECORD on the server; another device shows the card + the date instead). Polish: every call wrapped — a private
// window / blocked storage just has no photos. Per legendary it keeps the FIRST photo + the LATEST two (≤ 27 photos, ~0.3 MB each).
//   addPhoto({ id, t, n, blob, w }) · photos() → [{ k, id, t, n, buf, type, first }] newest first · photoUrl(rec) · clearAlbum()
const STORE = 'photos', KEEP_LATEST = 2;
let DB = 'ns-album', dbP = null;
/** THE OWNER's PREVIEWS keep their prints apart (&sgdemo → 'ns-album-preview'; ?preview=card reads it) — a preview never fills the real album */
export function useAlbum(name) { if (name !== DB) { DB = name; dbP = null; } }
function open() {
  if (dbP) return dbP;
  dbP = new Promise((res, rej) => {
    try {
      if (typeof indexedDB === 'undefined') { rej(new Error('no idb')); return; }
      const r = indexedDB.open(DB, 1);
      r.onupgradeneeded = () => { const s = r.result.createObjectStore(STORE, { keyPath: 'k', autoIncrement: true }); s.createIndex('id', 'id'); };
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error || new Error('idb'));
      r.onblocked = () => rej(new Error('idb blocked'));
    } catch (e) { rej(e); }
  }).catch(e => { dbP = null; throw e; });
  return dbP;
}
const tx = (db, mode) => db.transaction(STORE, mode).objectStore(STORE);
const all = st => new Promise((res, rej) => { const q = st.getAll(); q.onsuccess = () => res(q.result || []); q.onerror = () => rej(q.error); });
const done = t => new Promise((res, rej) => { t.oncomplete = () => res(); t.onerror = () => rej(t.error); t.onabort = () => rej(t.error); });

export async function photos() {
  try { const db = await open(); const list = await all(tx(db, 'readonly')); return list.sort((a, b) => b.t - a.t); } catch { return []; }
}
export async function addPhoto({ id, t, n = 1, blob, w = 0 }) {
  if (!blob) return false;
  try {
    // (the JPEG's BYTES, never the Blob: WebKit's private / ephemeral IndexedDB refuses Blobs — an ArrayBuffer stores everywhere)
    const buf = await blob.arrayBuffer(), type = blob.type || 'image/jpeg';
    const db = await open();
    const mine = (await all(tx(db, 'readonly'))).filter(p => p.id === id).sort((a, b) => a.t - b.t);
    const t2 = db.transaction(STORE, 'readwrite'), st = t2.objectStore(STORE);
    st.add({ id, t, n, buf, type, w, first: !mine.length });
    // keep the first + the latest KEEP_LATEST (the new one counts)
    const later = mine.filter(p => !p.first);
    for (const p of later.slice(0, Math.max(0, later.length - (KEEP_LATEST - 1)))) st.delete(p.k);
    await done(t2);
    return true;
  } catch { return false; }
}
export async function clearAlbum() { try { const db = await open(); const t2 = db.transaction(STORE, 'readwrite'); t2.objectStore(STORE).clear(); await done(t2); } catch { /* polish */ } }
const urls = new Map();
/** an object URL for a photo (cached per record; the album's sheet revokes them when it closes) */
export function photoUrl(p) { if (!p || !(p.buf || p.blob)) return null; if (!urls.has(p.k)) urls.set(p.k, URL.createObjectURL(p.blob || new Blob([p.buf], { type: p.type || 'image/jpeg' }))); return urls.get(p.k); }
export function releaseUrls() { for (const u of urls.values()) URL.revokeObjectURL(u); urls.clear(); }
