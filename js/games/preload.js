// FRIENDS C — THE SLOW-3G START (OC8: on a slow line a guest's match screen came late — the cartridge, then its view, then their modules,
// each found only once its parent had arrived: a WATERFALL of round trips). js/games/preload-graph.js (GENERATED — scripts/build-preload-graph.mjs)
// lists each playable cartridge's WHOLE graph past the boot; wireGame(id) puts every module on the wire AT ONCE (<link rel="modulepreload"> —
// fetched + parsed, never run) + its two stylesheets. Imported on demand (never in the boot graph): the lobby wires the playable cartridges a few
// seconds in (room-city.js), the host's options sheet + its tap and every phone's start wire the room's game, then load it as before.
import { GAME_IDS, GAME_MODULES, loadGame } from './registry.js';
import { PRELOAD } from './preload-graph.js';

const wired = new Set();
export function wireGame(id) {
  if (typeof document === 'undefined' || !GAME_IDS.includes(id) || GAME_MODULES[id]) return false;
  const add = (rel, f, as) => { const href = new URL(`../../${f}`, import.meta.url).href; if (wired.has(href)) return; wired.add(href); const l = document.createElement('link'); l.rel = rel; l.href = href; if (as) l.as = as; document.head.append(l); };
  for (const f of PRELOAD[id] || []) add('modulepreload', f);
  for (const n of ['kit', id]) add('preload', `css/${n}.css`, 'style');
  return true;
}
/** the room's game: its graph wired at once, then loaded (registry.js#loadGame) */
export function preloadGame(id) { wireGame(id); return loadGame(id); }
