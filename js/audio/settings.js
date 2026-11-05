// Device-wide audio/haptics preferences (not per identity slot).
const KEY = 'na:settings';
const DEFAULTS = { music: 0.35, sfx: 0.7, muted: false, musicOff: false, sfxOff: false, haptics: true, pulseHits: false, prismScheme: 'gesture', prismSens: 0.5, prismBtn: 0.5, prismFlick: false, prismSlam: 'right', reducedFx: false, alwaysNight: false, menuMusic: 'mood', musicMood: 'auto', speakerDelay: 0 }; // reducedFx: calmer effects everywhere (title intro, PRISM DROP) // musicOff: silent music, effects stay // musicMood: AUTO (the time of day) or a chosen mood (audio/mood.js#MOOD_CHOICES), both cities // PULSE hit sounds: off by default // speakerDelay (ms, MODELS): a TV / soundbar / Bluetooth speaker's own delay the browser can't see — the synced songs play that much earlier here
const listeners = new Set();

function load() {
  try {
    const s = { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || '{}') };
    if (s.prismReduced && !s.reducedFx) s.reducedFx = true; // the old PRISM-only switch became the global one
    delete s.prismReduced;
    return s;
  } catch { return { ...DEFAULTS }; }
}

// MODELS — THE PHONE BENCH RUNS SILENT (the owner, Oct 30: it asked for a TAP FOR SOUND on every scene — he tapped late on the first
// ones): under `&bench=1` THIS PAGE is muted with its music off — never saved (the device's own choice is kept + written back), so no
// scene waits for, or asks for, a tap; sound is not measured.
export const PAGE_SILENT = (() => { try { return /[?&]bench=1(?:&|$)/.test(location.search); } catch { return false; } })();
const saved = load();
export const settings = PAGE_SILENT ? { ...saved, muted: true, musicOff: true } : saved;

// SPEED PASS B — THE SECOND TAB's MUSIC (the owner, Nov 4 8:56 pm: "a second tab never doubles the music"): a tab that YIELDED to another tab
// of the same player (identity.js#watchDuplicateTabs) is QUIET — its music off for this page only, never saved (the device's own choice is
// kept + written back, like PAGE_SILENT); it plays again the moment it's the player's tab.
let quietReal = null;
export function setPageQuiet(on) {
  if (!!on === (quietReal !== null)) return;
  if (on) { quietReal = settings.musicOff; settings.musicOff = true; } else { settings.musicOff = PAGE_SILENT ? true : quietReal; quietReal = null; }
  listeners.forEach(fn => fn(settings));
}
export const pageQuiet = () => quietReal !== null;

export function updateSettings(patch) {
  Object.assign(settings, patch);
  if (PAGE_SILENT) { for (const k of ['muted', 'musicOff']) if (k in patch) saved[k] = patch[k]; settings.muted = true; settings.musicOff = true; }
  if (quietReal !== null && 'musicOff' in patch) { quietReal = patch.musicOff; settings.musicOff = true; }
  const out = PAGE_SILENT ? { ...settings, muted: saved.muted, musicOff: saved.musicOff } : quietReal !== null ? { ...settings, musicOff: quietReal } : settings;
  try { localStorage.setItem(KEY, JSON.stringify(out)); } catch { /* private mode: keep in memory */ }
  listeners.forEach(fn => fn(settings));
}

export function onSettings(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
