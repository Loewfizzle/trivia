// PRISM DROP song data: data/prism/manifest.json (every song) + data/prism/prismN.json (beat grid, key, energy,
// world). Small JSON, cached for the session. The audio itself streams from audio/music/prismN.mp3 (audio.js).
const base = new URL('../../../', import.meta.url);
let manifest = null;
const docs = new Map();

export function loadManifest() {
  if (!manifest) {
    manifest = fetch(new URL('data/prism/manifest.json', base)).then(r => r.json()).then(m => m.songs)
      .catch(e => { manifest = null; throw e; });
  }
  return manifest;
}

export function loadSong(id) {
  if (!docs.has(id)) docs.set(id, fetch(new URL(`data/prism/${id}.json`, base)).then(r => r.json()).catch(e => { docs.delete(id); throw e; }));
  return docs.get(id);
}

export const songUrl = id => new URL(`audio/music/${id}.mp3`, base).href;

/** The beat grid as a function: time of beat i (seconds), extrapolated past the ends. */
export function beatClock(doc) {
  const beats = (doc && doc.beats) || [];
  const period = (doc && doc.period) || 0.5;
  const first = beats.length ? beats[0] : 0;
  return {
    period,
    phase: (doc && doc.phase) || 0,
    /** index of the beat at or before t (can be negative / past the end) */
    indexAt(t) {
      if (!beats.length || t < first) return Math.floor((t - first) / period);
      if (t >= beats[beats.length - 1]) return beats.length - 1 + Math.floor((t - beats[beats.length - 1]) / period);
      let lo = 0, hi = beats.length - 1;
      while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (beats[mid] <= t) lo = mid; else hi = mid - 1; }
      return lo;
    },
    timeOf(i) {
      if (!beats.length) return i * period;
      if (i < 0) return first + i * period;
      if (i >= beats.length) return beats[beats.length - 1] + (i - beats.length + 1) * period;
      return beats[i];
    },
    energyAt(t) {
      const e = (doc && doc.energy) || [];
      if (!e.length) return 0.5;
      const i = Math.max(0, Math.min(e.length - 1, this.indexAt(t)));
      return e[i];
    },
  };
}

/** The first downbeat at or after `minSec` (the GO of the countdown). */
export function goBeat(doc, minSec) {
  const clk = beatClock(doc);
  let i = Math.max(0, clk.indexAt(minSec));
  while (clk.timeOf(i) < minSec || ((i - clk.phase) % 4 + 4) % 4 !== 0) i++;
  return { index: i, time: clk.timeOf(i), period: clk.period };
}
