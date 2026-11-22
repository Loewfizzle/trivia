// THE FIX PASS (Nov 22 — THE FABLE REVIEW's P8 + P1): the card a GAME SCREEN shows when its view can't run — games/lazy-view.js's boundary.
import { h } from './dom.js';
import { lazyImport } from './lazy-import.js';   // (the card's shell + the store — loaded already, never a static import: the pure tests import lazy-view.js)

// THE FIX PASS — P8, THE ERROR BOUNDARY (THE FABLE REVIEW: a failed view import or a throwing mount / update was reported and nothing else
// happened — a BLANK match to the end, no message). Now: the view's load gets ONE retry, then — or on a throw in mount / update — a calm
// card through THE SHELL's builders (no pill): SOMETHING BROKE + BACK TO THE ROOM (the menu's QUIT TO THE ROOM: the others play on) — or
// BACK TO THE CITY in a solo room — reported to /admin once. P1, THE FEATURE CARD: a game that needs what this browser lacks (`needs` —
// JAYWALK + HIGH RISE: import maps, the bare 'three' — Safari below 16.4) shows its own card instead of loading at all.
/** the card on a game screen: `t` the headline, `p` the line under it; the one way out back to the room (or the city, solo) */
export function brokeCard(el, t, p) {
  const P = globalThis.__nsPlayNow, solo = !!(P && typeof P.isSolo === 'function' && P.isSolo());
  el.replaceChildren(h('div.gk-broke', { role: 'alert' }, h('b.gk-broke-t', t), p ? h('p.gk-broke-p', p) : null));
  Promise.all([lazyImport(import('./components.js'), './components.js'), lazyImport(import('../store.js'), '../store.js')]).then(([{ tubeButton }, { state, setState }]) => {
    const out = () => {
      if (solo) { Promise.resolve(P.leave()).catch(() => {}); return; }
      if (state.game && state.game.matchId) setState({ quit: state.game.matchId });
    };
    const box = el.querySelector('.gk-broke');
    if (box) box.append(tubeButton(solo ? 'BACK TO THE CITY' : 'BACK TO THE ROOM', { kind: 'primary', block: true, cls: 'gk-broke-b', onClick: out }));
  }).catch(() => {});
}
export const BROKE_LINE = 'This game hit a problem on your phone. The others can play on — you’ll be dealt into the next one.';
/** P1 — the feature a game's view needs that THIS browser lacks: import maps (three.js arrives as the bare name 'three', index.html's map) */
export const importMapsOk = () => { try { return !!(typeof HTMLScriptElement !== 'undefined' && HTMLScriptElement.supports && HTMLScriptElement.supports('importmap')); } catch { return false; } };
export const needsImportMaps = name => ({ ok: importMapsOk, t: `UPDATE YOUR iPHONE TO PLAY ${name}`, p: `${name} needs iOS 16.4 or newer (Settings → General → Software Update), or a newer browser. Every other game plays as it is.`, why: 'no import maps' });
// (THE STALE-MODULE RULE: a cartridge — a LAZY chunk — reads this through a HUB, never a new export of this boot module)
globalThis.__nsViewNeeds = { importMaps: needsImportMaps };
