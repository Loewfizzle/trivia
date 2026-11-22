// A game's view (screens, renderers — the bulk of each game's code) and its stylesheets (css/kit.css + css/<id>.css) are
// loaded only when a match of that game is on screen, so the app's first paint never waits for them. Returns an object with
// the synchronous view contract { mount, update, unmount } that forwards to the real view once BOTH have loaded (never an
// unstyled frame). index.html links only the sheets every screen needs (base, components, screens, title + chat, board, card).
import { reportError } from '../errlog.js';
import { brokeCard, BROKE_LINE } from '../ui/game-broke.js';   // (THE FIX PASS — P8 + P1)

// The cascade order the sheets always had in index.html: a lazily loaded sheet is inserted at its old place among the
// sheets already on the page, so which rule wins a tie never depends on which game was played first.
const ORDER = ['cipher', 'signal', 'overclock', 'bluff', 'pulse', 'golf', 'agent', 'kit', 'prism', 'holdem', 'password', 'coastclear', 'jaywalk', 'highrise-play', 'slip', 'gridlock', 'chat', 'board', 'card', 'stakes', 'rum'];
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

/** css: stylesheet names (see gameSheets) · needs: a feature check (THE FIX PASS P1) — P8: one retry, then the card (docs/cartridge.md) */
export function lazyView(load, css = [], { needs = null } = {}) {
  // (LOBBY 2.0 B — THE CARTRIDGE PLUG: warm() loads the view + its sheets ahead — the console calls it on every phone at the game start)
  let warmed = null;
  const createView = function createView() {
    let inner = null, el = null, st = null, gone = false, broke = '';
    const fail = (e, label, t = 'SOMETHING BROKE', p = BROKE_LINE) => {
      if (broke) return;
      broke = label;
      console.warn('game view', label, e);
      reportError(e, label);
      if (inner && el) { try { inner.unmount(); } catch { /* it broke already */ } }
      inner = null;
      if (el) brokeCard(el, t, p);
    };
    const lacking = needs && !needs.ok();
    if (lacking) { broke = 'needs'; reportError(new Error(`a game view needs ${needs.why}`), 'view needs'); }
    else {
      const go = n => loadAll(load, css).then(m => {
        if (gone) return;
        inner = m.createView();
        if (el) { try { inner.mount(el, st); } catch (e) { fail(e, 'view mount'); } }
      }, e => { if (gone) return; if (n < 1) setTimeout(() => { if (!gone) go(n + 1); }, 1500); else fail(e, 'view load'); });
      go(0);
    }
    return {
      mount(e, s) {
        el = e; st = s;
        if (lacking) { brokeCard(e, needs.t, needs.p); return; }
        if (broke) { brokeCard(e, 'SOMETHING BROKE', BROKE_LINE); return; }
        if (inner) { try { inner.mount(e, s); } catch (x) { fail(x, 'view mount'); } }
      },
      update(s) { st = s; if (inner && el && !broke) { try { inner.update(s); } catch (x) { fail(x, 'view update'); } } },
      unmount() { gone = true; if (inner && el) { try { inner.unmount(); } catch (x) { console.warn('game view unmount', x); } } el = null; },
      // (THE CONSOLE FIX — THE RUN HOLD: the real view's answer — app.js keeps a screen whose own live proven run is not over)
      holdsRun() { return !!(inner && el && !broke && typeof inner.holdsRun === 'function' && inner.holdsRun()); },
    };
  };
  createView.warm = () => (needs && !needs.ok() ? Promise.resolve() : (warmed ||= loadAll(load, css).catch(() => { warmed = null; })));
  return createView;
}

/** Warm a game's stylesheets ahead of its match (the lobby does this when the host opens a game's options). */
export const preloadSheets = id => { gameSheets(id).forEach(loadSheet); };
