// A game's view (screens, renderers — the bulk of each game's code) and its stylesheets (css/kit.css + css/<id>.css) are
// loaded only when a match of that game is on screen, so the app's first paint never waits for them. Returns an object with
// the synchronous view contract { mount, update, unmount } that forwards to the real view once BOTH have loaded (never an
// unstyled frame). index.html links only the sheets every screen needs (base, components, screens, title + chat, board, card).
import { reportError } from '../errlog.js';

// The cascade order the sheets always had in index.html: a lazily loaded sheet is inserted at its old place among the
// sheets already on the page, so which rule wins a tie never depends on which game was played first.
const ORDER = ['cipher', 'signal', 'overclock', 'bluff', 'pulse', 'golf', 'agent', 'kit', 'prism', 'slip', 'gridlock', 'chat', 'board', 'card', 'stakes', 'rum'];
const CSS_DIR = new URL('../../css/', import.meta.url);
const nameOf = href => { const m = /\/css\/([\w-]+)\.css(?:$|\?)/.exec(href || ''); return m ? m[1] : null; };

const sheets = new Map();
/** Loads css/<name>.css once, at its place in ORDER. Resolves when it applies — or fails (unstyled beats stuck). */
export function loadSheet(name) {
  if (sheets.has(name)) return sheets.get(name);
  const p = new Promise(resolve => {
    const links = [...document.querySelectorAll('link[rel="stylesheet"]')];
    const have = links.find(l => nameOf(l.href) === name && l.media !== 'print');
    if (have && have.sheet) { resolve(); return; }
    const link = have || document.createElement('link');
    link.addEventListener('load', () => resolve(), { once: true });
    link.addEventListener('error', () => { sheets.delete(name); resolve(); }, { once: true });
    if (have) return;
    link.rel = 'stylesheet';
    link.href = new URL(`${name}.css`, CSS_DIR).href;
    const at = ORDER.indexOf(name);
    const next = at < 0 ? null : links.find(l => { const i = ORDER.indexOf(nameOf(l.href)); return i > at; });
    if (next) next.before(link); else document.head.append(link);
  });
  sheets.set(name, p);
  return p;
}

/** The stylesheets a game's screen needs: the match kit's + its own. */
export const gameSheets = id => ['kit', id];

const loadAll = (load, css) => Promise.all([load(), ...css.map(loadSheet)]).then(([m]) => m);

/** css: stylesheet names (see gameSheets) to load with the view. */
export function lazyView(load, css = []) {
  return function createView() {
    let inner = null, el = null, st = null, gone = false;
    loadAll(load, css).then(m => {
      if (gone) return;
      inner = m.createView();
      if (el) inner.mount(el, st);
    }).catch(e => { console.warn('game view', e); reportError(e, 'view load'); });
    return {
      mount(e, s) { el = e; st = s; if (inner) inner.mount(e, s); },
      update(s) { st = s; if (inner && el) inner.update(s); },
      unmount() { gone = true; if (inner && el) inner.unmount(); el = null; },
    };
  };
}

/** Warm a game's stylesheets ahead of its match (the lobby does this when the host opens a game's options). */
export const preloadSheets = id => { gameSheets(id).forEach(loadSheet); };
