// JAYWALK — THE MATCH SCREEN: A STUB (H1). The game is BEING BUILT — its real screen comes in H2 (the night look + the kid) and H4 (the
// match: GO written to the proof node, the hop log's chunks, the ghosts). Until then a match of it (a local emulator page with &preview=1,
// or the owner's phone) shows this card; the graybox the owner plays is /jaywalk-lab (js/games/jaywalk/lab.js). Renders purely from state.
import { h } from '../../ui/dom.js';

const lineOf = g => (!g ? '' : g.phase === 'count' ? 'GET READY' : g.phase === 'play' ? 'THE MATCH SCREEN IS BEING BUILT' : 'RUN OVER');

export function createView() {
  let root = null, line = null;
  return {
    mount(el, state) {
      line = h('p.jw-stub-line', lineOf(state.game));
      root = h('section.jw-stub', h('div.jw-stub-k', 'BEING BUILT'), h('h1.jw-stub-t', 'JAYWALK'), line, h('p.jw-stub-sub', 'The graybox lives on the lab page.'));
      el.replaceChildren(root);
    },
    update(state) { if (line) line.textContent = lineOf(state.game); },
    unmount() { if (root) root.remove(); root = null; line = null; },
  };
}
