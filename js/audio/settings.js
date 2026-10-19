// Device-wide audio/haptics preferences (not per identity slot).
const KEY = 'na:settings';
const DEFAULTS = { music: 0.35, sfx: 0.7, muted: false, musicOff: false, haptics: true, pulseHits: false, prismScheme: 'gesture', prismSens: 0.5, prismBtn: 0.5, prismFlick: false, prismSlam: 'right', reducedFx: false, alwaysNight: false, menuMusic: 'mood' }; // reducedFx: calmer effects everywhere (title intro, PRISM DROP) // musicOff: silent music, effects stay // PULSE hit sounds: off by default
const listeners = new Set();

function load() {
  try {
    const s = { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || '{}') };
    if (s.prismReduced && !s.reducedFx) s.reducedFx = true; // the old PRISM-only switch became the global one
    delete s.prismReduced;
    return s;
  } catch { return { ...DEFAULTS }; }
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
