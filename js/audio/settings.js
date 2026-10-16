// Device-wide audio/haptics preferences (not per identity slot).
const KEY = 'na:settings';
const DEFAULTS = { music: 0.35, sfx: 0.7, muted: false, haptics: true, pulseHits: false }; // PULSE hit sounds: off by default
const listeners = new Set();

function load() {
  try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch { return { ...DEFAULTS }; }
}

export const settings = load();

export function updateSettings(patch) {
  Object.assign(settings, patch);
  try { localStorage.setItem(KEY, JSON.stringify(settings)); } catch { /* private mode: keep in memory */ }
  listeners.forEach(fn => fn(settings));
}

export function onSettings(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
