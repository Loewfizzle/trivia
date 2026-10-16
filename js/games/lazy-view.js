// A game's view (screens, renderers — the bulk of each game's code) is loaded only when a match of
// that game is on screen, so the app's first paint never waits for it. Returns an object with the
// synchronous view contract { mount, update, unmount } that forwards to the real view once loaded.
export function lazyView(load) {
  return function createView() {
    let inner = null, el = null, st = null, gone = false;
    load().then(m => {
      if (gone) return;
      inner = m.createView();
      if (el) inner.mount(el, st);
    }).catch(e => console.warn('game view', e));
    return {
      mount(e, s) { el = e; st = s; if (inner) inner.mount(e, s); },
      update(s) { st = s; if (inner && el) inner.update(s); },
      unmount() { gone = true; if (inner && el) inner.unmount(); el = null; },
    };
  };
}

/** Warm the module cache for a game's view (e.g. when its match is about to start). */
export const preloadView = load => { load().catch(() => {}); };
