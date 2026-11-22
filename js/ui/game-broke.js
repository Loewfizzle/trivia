// THE FIX PASS (P8 + P1): a game screen's card when its view can't run — games/lazy-view.js's boundary.
import { h } from './dom.js';
import { lazyImport } from './lazy-import.js';   // (the shell + the store lazily: the pure tests import lazy-view.js)

/** the card on a game screen (P8 SOMETHING BROKE · P1 the feature card) — docs/cartridge.md `createView`; solo: BACK TO THE CITY */
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
/** P1 — import maps (three.js arrives as the bare name 'three') */
export const importMapsOk = () => { try { return !!(typeof HTMLScriptElement !== 'undefined' && HTMLScriptElement.supports && HTMLScriptElement.supports('importmap')); } catch { return false; } };
export const needsImportMaps = name => ({ ok: importMapsOk, t: `UPDATE YOUR iPHONE TO PLAY ${name}`, p: `${name} needs iOS 16.4 or newer (Settings → General → Software Update), or a newer browser. Every other game plays as it is.`, why: 'no import maps' });
// (THE STALE-MODULE RULE: a cartridge reads it through a hub)
globalThis.__nsViewNeeds = { importMaps: needsImportMaps };
